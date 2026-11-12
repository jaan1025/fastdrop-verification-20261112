import type { TransferOutcome } from "../types"

/**
 * `TransferHook.execute` moves its whole slice to the wallet and reports it
 * consumed — the one strategy where consumed == claimed.
 *
 * ONE evaluation serves both doors — the quote ("what would claiming now do")
 * and the attribution ("what did that claim do"): the hook is a pure function
 * of the slice it is handed.
 */
export function transferOutcome(hookAmount: bigint): TransferOutcome {
  return {
    kind: "transferHook",
    // The hook's execute() return value — it consumes exactly what it transfers.
    consumed: hookAmount,
    // Landed in the wallet in the claim tx itself (one vault→recipient Transfer).
    claimed: hookAmount,
  }
}
