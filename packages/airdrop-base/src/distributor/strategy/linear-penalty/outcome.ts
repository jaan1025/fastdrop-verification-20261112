import { matchUnion } from "@repo/shared/utils"
import type { PenaltyOutcome, PenaltyTerms } from "../types"
import { evmPenaltyAmount } from "./penalty-evm"
import { solanaPenaltyAmount } from "./penalty-solana"

/**
 * What the penalty strategy does with its slice at `atUnix`.
 *
 * The on-chain penalty hook transfers NOTHING — it consumes ONLY the forfeited
 * amount (which stays in the vault) and lets the recipient's remainder fall
 * through to the configuration's fallback hook. So a penalty strategy never
 * claims and never locks; it only forfeits.
 *
 * ONE evaluation serves both doors: the quote passes `now`, the attribution
 * passes the recorded claim instant — the hook is deterministic in
 * (slice, terms, instant), so replaying it at the recorded instant reproduces
 * the on-chain split exactly.
 */
export function penaltyOutcome(
  hookAmount: bigint,
  terms: PenaltyTerms,
  atUnix: bigint,
): PenaltyOutcome {
  const forfeited = penaltyAmountAt(hookAmount, terms, atUnix)
  return {
    kind: "linearPenaltyHook",
    // The hook's execute() return value — it consumes ONLY what it forfeits.
    // The slice's un-forfeited remainder is NOT consumed here: it falls
    // through to the fallback hook and is accounted in THAT strategy's outcome.
    consumed: forfeited,
    // Always 0: the hook performs no transfer. The recipient's share of this
    // slice arrives via the fallback hook, never via the penalty hook.
    claimed: 0n,
    // Kept by the vault, per the penalty curve evaluated at `atUnix`.
    forfeited,
  }
}

/** The forfeited slice at `atUnix`, dispatched to the chain's contract mirror. */
export function penaltyAmountAt(hookAmount: bigint, terms: PenaltyTerms, atUnix: bigint): bigint {
  return matchUnion(terms, "chainKind", {
    evm: (t) => evmPenaltyAmount(hookAmount, t, atUnix),
    solana: (t) => solanaPenaltyAmount(hookAmount, t, atUnix),
  })
}
