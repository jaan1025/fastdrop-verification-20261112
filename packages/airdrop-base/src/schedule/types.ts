import type { ChainKind } from "@repo/acs-client/model"

/**
 * Unlock cadence options the ACS schedule contract supports. Encoded on-chain as
 * a 256-bit `pieceDuration` value — see `./piece-duration.ts` for the layout.
 */
export type UnlockInterval = "continuous" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly"

/**
 * Form/display units that map onto seconds or calendar months when paired with an
 * `UnlockInterval`. Calendar-mode units (`months`, `quarters`, `years`) only
 * combine with calendar-mode intervals.
 */
export type TimeUnit = "days" | "weeks" | "months" | "quarters" | "years"

/**
 * The ONE canonical schedule form shape. Every consumer (code derivation,
 * configuration build, curve) reads this — it reconciles the legacy
 * `unlockInterval`↔`interval` drift to a single `interval` term (analysis L2).
 */
export interface ScheduleInput {
  name: string
  displayName?: string
  description?: string
  cliffValue: number
  cliffUnit: TimeUnit
  durationValue: number
  durationUnit: TimeUnit
  interval: UnlockInterval
  /** TGE unlock percent (0–100). */
  startUnlockPercent: number
  /** Cliff unlock percent (0–100). */
  cliffUnlockPercent: number
  useFixedStartTime: boolean
  /** ISO start string when fixed; null/"" when flexible. */
  startTime?: string | null
}

/**
 * The string-percent projection of `ScheduleInput` consumed by
 * `deriveScheduleCode` (percents as raw strings to match the legacy byte input).
 * Derived from `ScheduleInput` via `toScheduleCodeProjection` (in `code.ts`),
 * never hand-authored — closes analysis L2's hand-mapping.
 */
export type ScheduleCodeProjection = {
  name: string
  cliffValue: number
  cliffUnit: TimeUnit
  durationValue: number
  durationUnit: TimeUnit
  unlockInterval: UnlockInterval
  useFixedStartTime: boolean
  /** Raw form string (e.g. "2026-01-15T00:00:00", or "" when flexible). */
  startTime: string
  /** Raw user percent string (e.g. "10" for 10% — NOT the contract wad). */
  startUnlockPercentage: string
  cliffUnlockPercentage: string
}

/**
 * The derived, chain-agnostic schedule model (output of `deriveSchedule`); the
 * shape `@repo/components` (`SchedulePanel`, `VestingChart`) and the apps' detail
 * pages render.
 */
export interface Schedule {
  /** The derived 6-hex schedule code. */
  code: string
  displayName: string
  description?: string
  interval: UnlockInterval
  cliffSeconds: bigint
  vestingSeconds: bigint
  startUnlockPercent: number
  cliffUnlockPercent: number
  isFixedStart: boolean
  startTimeUnix: bigint | null
  /** 256-bit encoded interval (byte 23 = mode, bytes 24..31 = u64 BE). */
  pieceDuration: bigint
}
