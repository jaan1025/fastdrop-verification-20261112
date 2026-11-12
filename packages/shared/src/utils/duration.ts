import { parseUtcDate, type TimeInput } from "./date"

/**
 * UTC calendar arithmetic — advancing an instant by a schedule duration. Kept
 * apart from `date.ts` (which owns parse/format/conversion): this is the
 * "add N units" concern. All stepping runs in UTC (native `setUTC*` / fixed-ms
 * spans) so the result is the same instant regardless of the viewer's zone,
 * matching the UTC display + the UTC-anchored protocol calendar math.
 */

const DAY_MS = 86_400_000

/** Calendar / exact time unit (structurally matches the schedule `TimeUnit`). */
export type CalendarUnit = "days" | "weeks" | "months" | "quarters" | "years"

/** Add whole calendar months in UTC, clamping the day to the target month's
 *  length (Jan 31 + 1mo → Feb 28/29) — matches date-fns `addMonths` via native
 *  `setUTC*` (time-of-day preserved), zone-independent. Invalid → Invalid Date. */
export function addUtcMonths(input: TimeInput, months: number): Date {
  const r = parseUtcDate(input)
  if (Number.isNaN(r.getTime())) return r
  const day = r.getUTCDate()
  r.setUTCDate(1) // avoid day-overflow while changing the month
  r.setUTCMonth(r.getUTCMonth() + months)
  const lastDayOfMonth = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate()
  r.setUTCDate(Math.min(day, lastDayOfMonth))
  return r
}

/** Advance an instant by `value` of `unit`, in UTC. Calendar units (months /
 *  quarters / years) step by whole months (clamped); day / week are exact fixed
 *  spans. Zone-independent. Invalid → Invalid Date. */
export function addUtcDuration(input: TimeInput, value: number, unit: CalendarUnit): Date {
  const start = parseUtcDate(input)
  if (Number.isNaN(start.getTime())) return start
  switch (unit) {
    case "days":
      return new Date(start.getTime() + value * DAY_MS)
    case "weeks":
      return new Date(start.getTime() + value * 7 * DAY_MS)
    case "months":
      return addUtcMonths(start, value)
    case "quarters":
      return addUtcMonths(start, value * 3)
    case "years":
      return addUtcMonths(start, value * 12)
  }
}
