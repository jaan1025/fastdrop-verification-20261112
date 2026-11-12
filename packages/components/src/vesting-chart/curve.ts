import type { Schedule, UnlockInterval } from "@repo/airdrop-base/schedule"
import { intervalMonths, intervalSeconds, isCalendarMode } from "@repo/airdrop-base/schedule"

/**
 * Projects a `Schedule` into a series of `CurvePoint`s (cumulative unlocked
 * fraction over time) for the vesting chart + progress bar. Pure, render-free.
 *
 * A DISPLAY projection, not protocol math: it expresses the schedule SHAPE — a
 * **staircase** of discrete unlocks (flat between step boundaries, a vertical
 * jump at each), matching how the lock contract releases per period. The
 * byte-exact on-chain claimable lives in `claimable/`; live numbers are read
 * on-chain by the chain SDKs.
 *
 * Render contract: consumers plot these with a linear interpolation; the two
 * points emitted at the SAME `tSeconds` per step form the vertical riser. The
 * chart adds its own flat "fully unlocked" tail past the end (a plotting concern).
 */

export interface CurvePoint {
  /** Seconds from schedule start. */
  tSeconds: bigint
  /** Cumulative unlocked fraction at `t`, 0–1. */
  unlockedFraction: number
  /** Phase label for chart styling. */
  phase: "start" | "cliff" | "vesting" | "complete"
}

const APPROX_MONTH_SECONDS = 2_592_000n

// Display ceiling on staircase steps. A finer cadence than this over a long span
// can't be read as discrete steps anyway, so fall back to a single diagonal —
// which also keeps the point count bounded (no tab freeze on multi-year `daily`).
const MAX_STEPS = 366

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

/** Per-unlock-step seconds, or 0n for `continuous` (a single diagonal, no steps). */
function stepSecondsFor(interval: UnlockInterval): bigint {
  if (interval === "continuous") return 0n
  if (isCalendarMode(interval)) {
    return BigInt(intervalMonths(interval)) * APPROX_MONTH_SECONDS
  }
  return intervalSeconds(interval)
}

export function scheduleToCurve(schedule: Schedule): CurvePoint[] {
  const { cliffSeconds, vestingSeconds, startUnlockPercent, cliffUnlockPercent } = schedule
  const startFraction = startUnlockPercent / 100
  const baseCumulative = (startUnlockPercent + cliffUnlockPercent) / 100
  const vestPool = clamp01(1 - baseCumulative)
  const end = cliffSeconds + vestingSeconds

  const points: CurvePoint[] = []

  // Pre-cliff: flat at the TGE fraction, then a vertical jump to start+cliff at
  // the cliff boundary. (No cliff → the curve simply starts at the base.)
  if (cliffSeconds > 0n) {
    points.push({ tSeconds: 0n, unlockedFraction: startFraction, phase: "start" })
    points.push({ tSeconds: cliffSeconds, unlockedFraction: startFraction, phase: "cliff" })
    points.push({ tSeconds: cliffSeconds, unlockedFraction: baseCumulative, phase: "cliff" })
  } else {
    points.push({ tSeconds: 0n, unlockedFraction: baseCumulative, phase: "start" })
  }

  const stepSeconds = stepSecondsFor(schedule.interval)
  // Round (not ceil): the derived `vestingSeconds` uses REAL calendar months, so
  // a 1-year monthly schedule is 365d, not 12×30d — ceil would add a phantom 13th
  // step. Round recovers the intended period count (365/30 ≈ 12.17 → 12).
  const stepCount =
    stepSeconds > 0n ? Math.max(1, Math.round(Number(vestingSeconds) / Number(stepSeconds))) : 0

  if (vestingSeconds <= 0n || vestPool <= 0) {
    // Already at the base unlock; nothing to vest. Terminal point at `end`.
    points.push({ tSeconds: end, unlockedFraction: baseCumulative, phase: "complete" })
  } else if (stepSeconds <= 0n || stepCount <= 1 || stepCount > MAX_STEPS) {
    // Continuous (or one step spans the whole period, or too fine to draw as
    // discrete steps): a single straight diagonal from the cliff to full unlock.
    points.push({ tSeconds: end, unlockedFraction: 1, phase: "complete" })
  } else {
    // Staircase: flat between step boundaries, a vertical jump at each. Two
    // points per step at the SAME tSeconds (pre-jump, post-jump) form the riser.
    const perStep = vestPool / stepCount
    for (let i = 1; i <= stepCount; i++) {
      const last = i >= stepCount
      const t = last ? end : cliffSeconds + stepSeconds * BigInt(i)
      const prev = clamp01(baseCumulative + perStep * (i - 1))
      const next = last ? 1 : clamp01(baseCumulative + perStep * i)
      points.push({ tSeconds: t, unlockedFraction: prev, phase: "vesting" })
      points.push({
        tSeconds: t,
        unlockedFraction: next,
        phase: last ? "complete" : "vesting",
      })
    }
  }

  return points
}
