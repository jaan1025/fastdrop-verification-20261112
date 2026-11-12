import { type Rpc, type SolanaRpcApi, type Address } from "@solana/kit"
import { accounts } from "@sqds/multisig"
import { Buffer } from "buffer"
import { sleep } from "@repo/shared/utils"
import { resolveProposalAddress } from "./proposal"
import { type ProposalStatusKind, buildTerminalMessage, buildTimeoutMessage } from "./messages"

/**
 * Squads V4 proposal-execution poll loop. Split out of the former
 * `squadsx/execution.ts`. Parallel role to the EVM kit's
 * `wallet-tx/safe/execution.ts` (which watches Safe events): resolve the real
 * on-chain execution of a tx submitted through a multisig. Solana does it by
 * polling the Squads proposal account; EVM by watching the Safe's execution
 * events.
 *
 * The SquadsX message-signing routine (which composes this with the
 * commit-reveal scheme) lives in `signing/commit-reveal/squads.ts`.
 */

/** Polling defaults: 5s interval, 2 hours total */
const SQDS_POLL_INTERVAL = 5_000
const SQDS_POLL_MAX_ATTEMPTS = 1_440

/**
 * Polls the on-chain proposal status until it is executed,
 * then returns the execution transaction signature.
 *
 * Bails out early on terminal failure statuses (`Rejected`, `Cancelled`) with
 * an actionable error rather than burning the full polling window. On timeout,
 * surfaces the last-seen status so the user knows whether they need to approve,
 * execute, or wait.
 */
export const waitForExecution = async (params: {
  rpc: Rpc<SolanaRpcApi>
  proposalSignature: string
  maxAttempts?: number
  interval?: number
}): Promise<string> => {
  const {
    rpc,
    proposalSignature,
    maxAttempts = SQDS_POLL_MAX_ATTEMPTS,
    interval = SQDS_POLL_INTERVAL,
  } = params

  let proposalAddress: Address | undefined
  let lastStatus: ProposalStatusKind | undefined
  let lastTransientError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Phase 1 — fetch + decode. Any failure here is transient: record it
    // and let the loop poll again.
    let kind: ProposalStatusKind | undefined
    try {
      if (!proposalAddress) {
        proposalAddress = await resolveProposalAddress(rpc, proposalSignature)
      }

      const accountInfo = await rpc.getAccountInfo(proposalAddress, { encoding: "base64" }).send()

      if (accountInfo?.value) {
        const data = Buffer.from(accountInfo.value.data[0], "base64")
        const [proposal] = accounts.Proposal.deserialize(data)
        kind = proposal.status.__kind
        lastStatus = kind
        lastTransientError = undefined
      } else {
        lastTransientError = new Error("Squads proposal account not yet visible on chain")
      }
    } catch (e) {
      lastTransientError = e
    }

    // Phase 2 — act on observed state. Decisive throws live outside any
    // catch so they propagate as-is.

    if (kind === "Rejected" || kind === "Cancelled") {
      throw new Error(buildTerminalMessage(kind))
    }

    if (kind === "Executed") {
      // `proposalAddress` is always set when `kind` is set (see Phase 1).
      const address = proposalAddress!
      try {
        const signatures = await rpc.getSignaturesForAddress(address, { limit: 10 }).send()
        for (const { signature } of signatures) {
          if (signature !== proposalSignature) return signature
        }
        // Status flipped to `Executed` but the execution tx hasn't shown up
        // on the signature index yet (indexer lag between `getAccountInfo`
        // and `getSignaturesForAddress`). Treat as transient and keep polling.
        lastTransientError = new Error(
          "Squads proposal executed but its execution signature is not yet indexed",
        )
      } catch (e) {
        lastTransientError = e
      }
    }

    // `Draft`, `Active`, `Approved`, `Executing`, or transient failure —
    // keep polling.
    await sleep(interval)
  }

  throw new Error(buildTimeoutMessage(lastStatus, lastTransientError))
}
