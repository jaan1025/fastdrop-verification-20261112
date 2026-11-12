import { type Abi, BaseError, ContractFunctionRevertedError, type PublicClient } from "viem"
import { type ErrorAbis } from "./abis"
import {
  type DecodedErrorResult,
  decodeRevertErrorResult,
  decodeInputData,
  findMatchingAbiForInput,
} from "./decode"

// ---------------------------------------------------------------------------
// Format — turn a caught error (or a mined-reverted tx) into a USER MESSAGE.
// The (error)->message API parallels — by ROLE — the Solana kit's
// `errors/format.ts` (`formatError` / `toUserError`). Depends on the
// `decode.ts` layer; never the reverse.
// ---------------------------------------------------------------------------

const buildDecodedErrorMessage = (details: DecodedErrorResult): string => {
  const { errorName, args } = details
  const formattedArgs = args.length ? `(${args.join(", ")})` : ""
  return `Transaction reverted: ${errorName}${formattedArgs}`
}

/**
 * PARTIAL revert decoder: a decoded revert message, or `undefined` when the
 * error isn't a contract revert. Internal — `catchRevert` needs the `undefined`
 * to decide whether to wrap or rethrow; public callers use the total `formatError`.
 * Pure — no RPC. `errorAbis` is the injected DI seam; omit it to decode only
 * what viem already attached (`data.errorName`).
 */
export const formatRevertError = (err: unknown, errorAbis: ErrorAbis = []): string | undefined => {
  if (!(err instanceof BaseError)) {
    return undefined
  }

  const revertError = err.walk((e) => e instanceof ContractFunctionRevertedError)
  if (!(revertError instanceof ContractFunctionRevertedError)) {
    return undefined
  }

  const decoded = decodeRevertErrorResult(revertError, errorAbis)
  return decoded
    ? buildDecodedErrorMessage(decoded)
    : revertError.shortMessage || revertError.reason || "Transaction reverted"
}

/**
 * Format ANY caught error into a user message (total — always a string). Decodes
 * a contract revert when possible, else falls back to the raw error message.
 * Parallel to the Solana kit's `errors/format.ts::formatError`.
 */
export const formatError = (e: unknown, errorAbis?: ErrorAbis): string =>
  formatRevertError(e, errorAbis) ?? (e instanceof Error ? e.message : String(e))

/**
 * Wrap any caught error into a user-friendly Error with `cause` preserved.
 * Parallel to the Solana kit's `errors/format.ts::toUserError`.
 */
export const toUserError = (e: unknown, errorAbis?: ErrorAbis): Error =>
  new Error(formatError(e, errorAbis), { cause: e })

// ---------------------------------------------------------------------------
// Post-mining path — produce a revert message from a mined-reverted tx hash.
// Used by `transaction/receipt.ts` when a tx was broadcast then reverted on
// chain (no live thrown error in hand). Best-effort: getting the real custom
// error requires reproducing the revert, which needs the historical state.
// ---------------------------------------------------------------------------

/**
 * Best-effort revert message for a mined-reverted tx: fetch tx+receipt, re-simulate
 * the reverted call to capture and decode the custom error, and return a message.
 *
 * Reliability note: the re-simulation runs at the tx's own block, which a pruned
 * (non-archive) RPC may not have state for. When the simulation can't reproduce
 * the revert, we degrade to a neutral "Transaction reverted" rather than asserting
 * a (guessed) cause or losing the message entirely.
 */
export const simulateRevertMessage = async (
  publicClient: PublicClient,
  txHash: `0x${string}`,
  abi: Abi,
  errorAbis?: ErrorAbis,
): Promise<string> => {
  try {
    if (!publicClient) {
      throw new Error("Public client is required.")
    }

    const [tx, receipt] = await Promise.all([
      publicClient.getTransaction({ hash: txHash }),
      publicClient.getTransactionReceipt({ hash: txHash }),
    ])

    if (!receipt || receipt.status !== "reverted") {
      return "Transaction did not revert"
    }

    // No ABI, no tx, or a contract-creation tx (no `to`) → nothing to simulate.
    if (!abi || !tx || !tx.to) {
      return "Transaction reverted"
    }

    try {
      const decodedInputData = decodeInputData(tx.input, abi)

      await publicClient.simulateContract({
        address: tx.to,
        abi,
        functionName: decodedInputData.functionName!,
        args: decodedInputData.args!,
        value: tx.value,
        account: tx.from,
        blockNumber: receipt.blockNumber,
      })

      // Simulation did NOT revert — we couldn't reproduce the cause. Do not guess
      // (gas/nonce/state-drift are all possible); surface a neutral message.
      return "Transaction reverted (cause could not be reproduced via simulation)"
    } catch (err: unknown) {
      if (err instanceof BaseError) {
        const message = formatRevertError(err, errorAbis ?? [abi])
        if (message) {
          return message
        }
      }
      // Non-revert error (e.g. historical state unavailable on a pruned RPC) —
      // degrade gracefully instead of losing the generic revert message.
      return "Transaction reverted"
    }
  } catch {
    return "Could not determine revert reason"
  }
}

/**
 * Revert message for a mined tx hash: find the ABI whose function the tx called,
 * then re-derive the revert reason. Returns `undefined` when no candidate ABI
 * matches the tx calldata.
 */
export const getRevertMessageForTx = async (
  publicClient: PublicClient,
  txHash: `0x${string}`,
  errorAbis: ErrorAbis,
): Promise<string | undefined> => {
  try {
    const tx = await publicClient.getTransaction({ hash: txHash })
    const matchingAbi = tx?.input ? findMatchingAbiForInput(tx.input, errorAbis) : undefined
    if (!matchingAbi) return undefined
    return await simulateRevertMessage(publicClient, txHash, matchingAbi, errorAbis)
  } catch {
    return undefined
  }
}
