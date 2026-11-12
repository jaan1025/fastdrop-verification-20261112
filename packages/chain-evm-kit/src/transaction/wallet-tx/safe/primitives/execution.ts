// Safe execution-event wait. Resolve the real on-chain execution of a tx
// submitted through a Safe multisig by watching its `ExecutionSuccess` /
// `ExecutionFailure` events. (Solana's Squads arm does the equivalent by polling
// the proposal account — see `wallet-tx/squadsx/primitives/execution.ts`.)
import { type PublicClient } from "viem"
import { type SafeExecutionResult } from "../../types"

// Safe execution event topic0 hashes — identical across all Safe versions
// (v1.1.1, v1.3.0, v1.4.1) because the event signature string is unchanged.
//   keccak256('ExecutionSuccess(bytes32,uint256)')
const EXECUTION_SUCCESS_TOPIC0 =
  "0x442e715f626346e8c54381002da614f62bee8d27386535b2521ec8540898556e" as const
//   keccak256('ExecutionFailure(bytes32,uint256)')
const EXECUTION_FAILURE_TOPIC0 =
  "0x23428b18acfb3ea64b08dc0c1d296ea9c09702c09083ca5272e64d115b687d23" as const

// ---------------------------------------------------------------------------
// txHash layout differs between Safe versions:
//
//   v1.3.0 / v1.1.1 — txHash is NON-indexed:
//     topics = [topic0]
//     data   = abi.encode(txHash, payment)   (64 bytes: 32 + 32)
//     → txHash = data[0..31]  i.e. '0x' + data.slice(2, 66)
//
//   v1.4.1 — txHash is INDEXED:
//     topics = [topic0, txHash]
//     data   = abi.encode(payment)            (32 bytes)
//     → txHash = topics[1]
//
// We detect the layout at runtime per-log by inspecting topics.length.
// ---------------------------------------------------------------------------

type RawLog = {
  topics: `0x${string}`[]
  data: `0x${string}`
  transactionHash: `0x${string}` | null
  removed?: boolean
}

type WatchEventFn = (opts: {
  address: `0x${string}`
  topics: (`0x${string}` | `0x${string}`[])[]
  fromBlock: bigint
  onLogs: (logs: RawLog[]) => void
  onError: (e: Error) => void
}) => () => void

/** Extract safeTxHash from a raw Safe execution log, version-agnostic. */
const extractSafeTxHash = (log: RawLog): `0x${string}` | undefined => {
  if (log.topics.length >= 2) {
    // v1.4.1: txHash is indexed — lives in topics[1]
    return log.topics[1]
  }
  // v1.3.0: txHash is non-indexed — first 32 bytes of data
  if (log.data && log.data.length >= 66) {
    return `0x${log.data.slice(2, 66)}`
  }
  return undefined
}

/**
 * Watches the Safe contract's `ExecutionSuccess` / `ExecutionFailure` events
 * and resolves once a log matching `safeTxHash` is seen.
 *
 * Uses `watchEvent` on raw logs (not `watchContractEvent`) so that txHash
 * extraction is version-agnostic:
 *   - Safe v1.4.1: txHash is indexed → `log.topics[1]`
 *   - Safe v1.3.0 / v1.1.1: txHash is non-indexed → first 32 bytes of `log.data`
 *
 * Key-free: no Safe Transaction Service API call is made. viem's `watchEvent`
 * falls back to `getLogs` polling when the RPC does not support filters.
 *
 * @returns `{ onChainHash, success }` — the real on-chain tx hash and whether
 *   the Safe tx succeeded (`ExecutionSuccess`) or failed (`ExecutionFailure`).
 */
export const waitForExecution = (params: {
  publicClient: PublicClient
  safeAddress: `0x${string}`
  safeTxHash: `0x${string}`
  fromBlock: bigint
}): Promise<SafeExecutionResult> => {
  const { publicClient, safeAddress, safeTxHash, fromBlock } = params

  // Cast to our explicit minimal type to avoid deep generic instantiation from
  // viem's watchEvent overloads (TS2589 at viem 2.52 / TS 6).
  const watchFn = publicClient.watchEvent.bind(publicClient) as WatchEventFn

  // Initialize to no-ops so callbacks that fire synchronously during the
  // `watchEvent` call (e.g. in tests) can safely call these before the
  // return value has been assigned.
  let unwatch: () => void = () => {
    /* no-op */
  }

  const stop = (): void => {
    unwatch()
  }

  return new Promise((resolve, reject) => {
    const handleLog = (log: RawLog): void => {
      if (log.removed) return

      const topic0 = log.topics[0]
      const isSuccess = topic0 === EXECUTION_SUCCESS_TOPIC0
      const isFailure = topic0 === EXECUTION_FAILURE_TOPIC0
      if (!isSuccess && !isFailure) return

      const candidateTxHash = extractSafeTxHash(log)
      if (candidateTxHash !== safeTxHash) return

      // A matching execution log is always mined (carries a txHash), but the
      // RawLog type permits null — never resolve with a null hash. If one ever
      // arrives, skip it and keep waiting for the complete log. (This also
      // narrows the type, dropping the prior unsound `as` cast.)
      if (!log.transactionHash) return

      stop()
      resolve({ onChainHash: log.transactionHash, success: isSuccess })
    }

    const handleError = (e: Error): void => {
      stop()
      reject(e)
    }

    // Single watcher filtered to both topic0 values — one subscription handles
    // both ExecutionSuccess and ExecutionFailure across all Safe versions.
    unwatch = watchFn({
      address: safeAddress,
      topics: [[EXECUTION_SUCCESS_TOPIC0, EXECUTION_FAILURE_TOPIC0]],
      fromBlock,
      onLogs: (logs) => {
        for (const log of logs) handleLog(log)
      },
      onError: handleError,
    })
  })
}
