import { durationToSeconds } from "../intervals"
import { encodePieceDuration } from "../piece-duration"
import type { DurationModelInput, ResolvedDurations } from "./types"

/**
 * CALENDAR-month duration model: months/quarters/years walk real UTC calendar
 * months from `referenceUnixSeconds` (the vesting span is anchored at the cliff
 * END — reference + cliff — matching the on-chain build), and `pieceDuration` is
 * mode-1 (the contract walks calendar months at deploy/claim time). Self-
 * contained: durations + mode-1 pieceDuration locked to the SAME calendar model.
 * NOTE: only the Solana program executes mode-1; the EVM CliqueLock does not —
 * see the `reference_calendar_vs_fixed_span_lock` memory.
 */
export function resolveDurations(input: DurationModelInput): ResolvedDurations {
  const cliffSeconds = durationToSeconds({
    interval: input.interval,
    value: Number(input.cliffValue),
    unit: input.cliffUnit,
    referenceUnixSeconds: input.referenceUnixSeconds,
  })
  const vestingSeconds = durationToSeconds({
    interval: input.interval,
    value: Number(input.durationValue),
    unit: input.durationUnit,
    referenceUnixSeconds: input.referenceUnixSeconds + cliffSeconds,
  })
  return {
    cliffSeconds,
    vestingSeconds,
    pieceDuration: encodePieceDuration(input.interval),
  }
}
