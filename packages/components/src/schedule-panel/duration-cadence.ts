/**
 * DISPLAY-ONLY duration-cadence ladder. Renders a seconds span as a single
 * coarse human label using a 365-day-year / 30-day-month heuristic:
 *   `days % 365 === 0` → "N year(s)", else `days % 30 === 0` → "N month(s)",
 *   else "N day(s)". `days` is the floored whole-day count of `seconds`.
 *
 * The two special low-end cases are parameterized so different surfaces can
 * label them their own way:
 *   - `zeroLabel`   — span is exactly 0 seconds.
 *   - `subDayLabel` — span is > 0 but under one whole day (floors to 0 days).
 *     Defaults to `zeroLabel`, which collapses both low-end cases into one label
 *     (the "Instant"-style behavior where any sub-day span reads as zero).
 *
 * APPROXIMATE, UI-ONLY. The 30/365-day heuristic can mislabel calendar-derived
 * spans — it is a display convenience, never protocol-exact duration math. Lives
 * under `schedule/display/`, firewalled from the byte-critical vesting math.
 */

const DAY_SECONDS = 86_400n

export interface DurationCadenceLabels {
  /** Label for an exactly-zero span. */
  zeroLabel?: string
  /** Label for a positive sub-day span. Defaults to `zeroLabel`. */
  subDayLabel?: string
}

export function formatDurationCadence(seconds: bigint, opts: DurationCadenceLabels = {}): string {
  const zeroLabel = opts.zeroLabel ?? "Instant"
  const subDayLabel = opts.subDayLabel ?? zeroLabel

  if (seconds === 0n) return zeroLabel

  const days = Number(seconds / DAY_SECONDS)
  if (days === 0) return subDayLabel

  if (days % 365 === 0) {
    const y = days / 365
    return `${y} ${y === 1 ? "year" : "years"}`
  }
  if (days % 30 === 0) {
    const m = days / 30
    return `${m} ${m === 1 ? "month" : "months"}`
  }
  return `${days} ${days === 1 ? "day" : "days"}`
}
