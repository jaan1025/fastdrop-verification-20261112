import { fixedSpanSeconds } from "../intervals"
import type { UnlockInterval } from "../types"
import type { DurationModelInput, ResolvedDurations } from "./types"

// Mode-0 `pieceDuration` = raw interval seconds with FIXED calendar units
// (monthly = 30d, quarterly = 90d, yearly = 365d). The fixed-span counterpart to
// the calendar-aware `encodePieceDuration` (mode-1). Lifted verbatim from legacy
// `LockHookForm.intervalToSeconds`.
const FIXED_PIECE_DURATION: Record<UnlockInterval, bigint> = {
  continuous: 1n,
  daily: 86_400n,
  weekly: 604_800n,
  monthly: 2_592_000n,
  quarterly: 7_776_000n,
  yearly: 31_536_000n,
}

/**
 * FIXED-span duration model: months/quarters/years are 30/90/365-day spans and
 * `pieceDuration` is mode-0 raw seconds. Self-contained — durations and
 * pieceDuration are locked to the SAME fixed model, so they can never mismatch.
 * IGNORES `referenceUnixSeconds`. (This is also the only model the EVM CliqueLock
 * executes correctly — it has no calendar support.)
 */
export function resolveDurations(input: DurationModelInput): ResolvedDurations {
  return {
    cliffSeconds: fixedSpanSeconds(input.cliffValue, input.cliffUnit),
    vestingSeconds: fixedSpanSeconds(input.durationValue, input.durationUnit),
    pieceDuration: FIXED_PIECE_DURATION[input.interval],
  }
}
