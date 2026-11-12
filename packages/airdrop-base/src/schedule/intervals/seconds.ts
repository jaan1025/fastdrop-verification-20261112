import type { TimeUnit, UnlockInterval } from "../types"
import { UNIT_DAYS } from "./options"

/**
 * The protocol-exact duration↔seconds math: calendar-month and linear seconds
 * conversion, the on-chain reference instant, and the seconds→display-value
 * inversion. This is the EXACT seconds system (vs the approximate display helpers
 * in `@repo/components` (schedule-panel labels / vesting-chart curve)) — `deriveSchedule` and the claimable math reference it;
 * the branded display helpers must never substitute for it (analysis M3).
 */

const SECONDS_PER_DAY = 86_400n
const SECONDS_PER_WEEK = 604_800n

/**
 * Airdrop's FIXED span-per-unit in seconds (30-day months / 90-day quarters /
 * 365-day years, from {@link UNIT_DAYS}) — NOT calendar-month math. The on-chain
 * lock preset's cliff/vesting durations are built from these, so the lock DISPLAY
 * must use the SAME spans or the shown duration diverges from what's deployed.
 * Calendar-month math (`durationToSeconds` with a calendar interval) is the
 * vesting-console model — never use it to render an airdrop lock. The single
 * source for both the on-chain build and the display.
 */
export function fixedSpanSeconds(value: number | string, unit: TimeUnit): bigint {
  // Truncate-to-int + NaN→0, matching deriveSchedule's `finiteOrZero` so a
  // partial/draft config never throws; byte-identical to `BigInt(value)` for any
  // valid integer the on-chain build feeds.
  const n = Math.trunc(Number(value))
  if (!Number.isFinite(n)) return 0n
  return BigInt(n) * BigInt(UNIT_DAYS[unit]) * SECONDS_PER_DAY
}

export function isCalendarMode(interval: UnlockInterval): boolean {
  return interval === "monthly" || interval === "quarterly" || interval === "yearly"
}

export function intervalMonths(interval: UnlockInterval): number {
  switch (interval) {
    case "monthly":
      return 1
    case "quarterly":
      return 3
    case "yearly":
      return 12
    default:
      return 0
  }
}

export function intervalSeconds(interval: UnlockInterval): bigint {
  switch (interval) {
    case "continuous":
      return 1n
    case "daily":
      return SECONDS_PER_DAY
    case "weekly":
      return SECONDS_PER_WEEK
    default:
      return 0n
  }
}

export function unitToMonths(unit: TimeUnit): number {
  switch (unit) {
    case "months":
      return 1
    case "quarters":
      return 3
    case "years":
      return 12
    default:
      return 0
  }
}

export function unitToSeconds(value: number, unit: TimeUnit): bigint {
  const v = BigInt(value)
  switch (unit) {
    case "days":
      return v * SECONDS_PER_DAY
    case "weeks":
      return v * SECONDS_PER_WEEK
    default:
      return 0n
  }
}

export function calendarMonthDurationSeconds(params: {
  referenceUnixSeconds: bigint
  months: number
}): bigint {
  const { referenceUnixSeconds, months } = params
  if (months === 0) return 0n
  const reference = new Date(Number(referenceUnixSeconds) * 1000)
  const target = new Date(reference)
  target.setUTCMonth(target.getUTCMonth() + months)
  return BigInt(Math.floor(target.getTime() / 1000)) - referenceUnixSeconds
}

export function defaultReferenceUnixSeconds(now = Date.now()): bigint {
  // First of next UTC month at 00:00:00 — matches legacy reference.
  const d = new Date(now)
  d.setUTCMonth(d.getUTCMonth() + 1, 1)
  d.setUTCHours(0, 0, 0, 0)
  return BigInt(Math.floor(d.getTime() / 1000))
}

export function durationToSeconds(params: {
  interval: UnlockInterval
  value: number
  unit: TimeUnit
  referenceUnixSeconds: bigint
}): bigint {
  const { interval, value, unit, referenceUnixSeconds } = params
  if (!isCalendarMode(interval)) {
    return unitToSeconds(value, unit)
  }
  const months = value * unitToMonths(unit)
  return calendarMonthDurationSeconds({ referenceUnixSeconds, months })
}

/**
 * Decode seconds back to a display value+unit. Prefer the largest unit that
 * yields a whole number; fall back to days. Calendar durations are stored as raw
 * seconds, so they can't be inverted exactly without the original reference —
 * approximate against a 30-day month then ROUND and snap to the interval-multiple
 * (mirrors legacy `formatDurationWithMode`).
 */
export function durationFromSeconds(
  seconds: bigint,
  interval: UnlockInterval,
): { value: number; unit: TimeUnit } {
  if (seconds === 0n) return { value: 0, unit: "days" }
  if (isCalendarMode(interval)) {
    const approxMonths = Number(seconds) / 2_592_000
    const step = intervalMonths(interval)
    const months = step > 0 ? Math.round(approxMonths / step) * step : Math.round(approxMonths)
    if (months > 0 && months % 12 === 0) return { value: months / 12, unit: "years" }
    if (months > 0 && months % 3 === 0) return { value: months / 3, unit: "quarters" }
    if (months > 0) return { value: months, unit: "months" }
  }
  if (seconds % SECONDS_PER_WEEK === 0n) {
    return { value: Number(seconds / SECONDS_PER_WEEK), unit: "weeks" }
  }
  return { value: Number(seconds / SECONDS_PER_DAY), unit: "days" }
}
