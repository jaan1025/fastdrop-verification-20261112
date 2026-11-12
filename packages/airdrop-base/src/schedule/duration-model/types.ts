import type { TimeUnit, UnlockInterval } from "../types"

/**
 * The duration inputs a schedule lowers to its on-chain seconds form. Shared by
 * BOTH duration models so the two are drop-in interchangeable at a call-site.
 */
export interface DurationModelInput {
  cliffValue: number | string
  cliffUnit: TimeUnit
  durationValue: number | string
  durationUnit: TimeUnit
  interval: UnlockInterval
  /** Calendar anchor (unix seconds). The calendar-month model walks months from
   *  here; the fixed-span model IGNORES it. Caller passes the fixed-start ts, or
   *  `defaultReferenceUnixSeconds()` for a flexible start. */
  referenceUnixSeconds: bigint
}

/** The lowered on-chain shape: cliff/vesting span seconds + the 256-bit
 *  `pieceDuration`. Within ONE model these three are locked to the same time
 *  model — never mix a fixed duration with a mode-1 pieceDuration. */
export interface ResolvedDurations {
  cliffSeconds: bigint
  vestingSeconds: bigint
  pieceDuration: bigint
}
