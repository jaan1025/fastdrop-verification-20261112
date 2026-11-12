import type { TimeUnit, UnlockInterval } from "../types"

/**
 * Canonical interval/unit option lists — the single source for slices, pages, and
 * design refs. Leaf vocabulary, no runtime math.
 */

export const INTERVAL_OPTIONS: readonly UnlockInterval[] = [
  "continuous",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]

export const TIME_UNITS_MODE_0: readonly TimeUnit[] = ["days", "weeks"]
export const TIME_UNITS_MODE_1: readonly TimeUnit[] = ["months", "quarters", "years"]
export const TIME_UNITS_ALL: readonly TimeUnit[] = [...TIME_UNITS_MODE_0, ...TIME_UNITS_MODE_1]

// Approximate day count per unit. Used for UI math (chart axis, progress bars,
// "X days remaining") — NOT for on-chain operations, which use calendar math.
export const UNIT_DAYS: Record<TimeUnit, number> = {
  days: 1,
  weeks: 7,
  months: 30,
  quarters: 90,
  years: 365,
}
