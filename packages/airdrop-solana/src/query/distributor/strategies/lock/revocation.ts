import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import { getDistributorPDA } from "../../../../contracts/distributor/functions"
import { deriveStreamId } from "../../../../contracts/distributor/strategies/lock/stream-id"
import { getStreamPDA } from "../../../../contracts/lock/functions"
import { findRevokeStreamEventInLogs } from "../../../../contracts/lock/functions/events"
import { hexToBytes } from "@repo/shared/utils"
import { airdropSolanaKeys } from "../../../keys"

/** How many newest signatures to scan. Revoke `close`s the account, so its tx
 * sits at/near the head of the history; 30 absorbs unrelated ATA/rent txs. */
const SIGNATURE_SCAN_LIMIT = 30

export interface SolanaStreamRevocation {
  streamPda: Address
  streamId: Uint8Array
  /** RevokeStreamEvent located in the PDA's tx history. `false` = history
   * unavailable/pruned — the caller already knows the stream is revoked from
   * account state; only the AMOUNT is unrecoverable. (Named `eventFound`, not
   * `revoked`, deliberately: unlike the EVM shape's `revoked`, this never
   * answers "was it revoked" — account state already did.) */
  eventFound: boolean
  remainingAmount?: bigint
  /** Unix seconds (tx blockTime). */
  revokedAt?: number
  signature?: string
}

export type SolanaStreamRevocationQueryKey = ReturnType<typeof airdropSolanaKeys.revocation>

/**
 * Terminal-truth recovery for a revoked (closed) stream: derive the stream PDA
 * (pure — needs no account), walk its newest signatures, and decode the
 * `RevokeStreamEvent` out of the revoke tx's logs. `remainingAmount` is the
 * clawed-back portion, so `claimed = allocation − remainingAmount`.
 */
export const solanaStreamRevocationQueryOptions = (params: {
  chain: SolanaChain
  base: Address | undefined
  root: `0x${string}` | undefined
  /** Resolved claimer (`extra.recipient ?? addressHandler`) — streamId key. */
  recipient: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, recipient, base, root } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.revocation({ chain, base, root, recipient }),
    queryFn:
      rpc && recipient && base && root
        ? async (): Promise<SolanaStreamRevocation> => {
            const rootBytes = hexToBytes(root)
            const [distributorPda] = await getDistributorPDA(base)
            const streamId = deriveStreamId({
              distributorPda,
              root: rootBytes,
              claimer: recipient,
            })
            const [streamPda] = await getStreamPDA(streamId)

            const signatures = await rpc
              .getSignaturesForAddress(streamPda, { limit: SIGNATURE_SCAN_LIMIT })
              .send()
            // Newest-first (RPC order): the revoke tx closed the account, so it
            // is expected within the first few entries.
            for (const sig of signatures) {
              if (sig.err) continue
              const tx = await rpc
                .getTransaction(sig.signature, {
                  maxSupportedTransactionVersion: 0,
                  commitment: "confirmed",
                  encoding: "json",
                })
                .send()
              const event = findRevokeStreamEventInLogs(
                (tx?.meta?.logMessages ?? []) as readonly string[],
              )
              if (event && event.stream === streamPda) {
                return {
                  streamPda,
                  streamId,
                  eventFound: true,
                  remainingAmount: event.remainingAmount,
                  revokedAt: sig.blockTime != null ? Number(sig.blockTime) : undefined,
                  signature: sig.signature as string,
                }
              }
            }
            return { streamPda, streamId, eventFound: false }
          }
        : skipToken,
    // Terminal state: once found, immutable. found:false (pruned history) is a
    // real answer too; RPC errors reject and retry via react-query.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
