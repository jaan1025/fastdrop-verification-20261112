import { toUnixSeconds } from "@repo/shared/utils/date"
import type { Schedule, ScheduleInput } from "./types"
import { deriveScheduleCode } from "./code"
import { encodePieceDuration } from "./piece-duration"
import { defaultReferenceUnixSeconds, durationToSeconds } from "./intervals"

/**
 * Resolves the canonical `Schedule` SHAPE from a `ScheduleInput` — durations to
 * seconds, percents, fixed start, and the encoded pieceDuration. The pure
 * timing/percent kernel, minus the derived `code`; file-local because its only
 * consumer is `deriveSchedule` below, which welds the code in. Pure — no React,
 * no I/O.
 *
 * Resolves seconds via the protocol-exact `intervals/seconds.ts`, never the
 * branded display helpers in `@repo/components` (schedule-panel labels / vesting-chart curve).
 */

function parseStartUnix(input: ScheduleInput): bigint | null {
  if (!input.useFixedStartTime || !input.startTime) return null
  // A zoneless datetime-local string (e.g. "2026-06-22T10:26") is interpreted as
  // UTC by `toUnixSeconds`, so the previewed start + calendar-month anchor match
  // the UTC instant the on-chain build deploys (and the UTC display shows).
  const seconds = toUnixSeconds(input.startTime)
  return Number.isNaN(seconds) ? null : BigInt(seconds)
}

/**
 * Empty NumberFields surface as NaN (they never coerce to 0), and the live
 * create-form preview pipes raw form values straight through this seam. Normalize
 * degenerate numeric input to 0 here — same defensive contract as the bad-startTime
 * fallback — so the strict, protocol-exact seconds math never sees NaN.
 */
const finiteOrZero = (value: number): number => (Number.isFinite(value) ? value : 0)

function deriveScheduleShape(input: ScheduleInput, now?: bigint): Omit<Schedule, "code"> {
  // Calendar durations need an anchor instant; fixed start uses it, else the
  // canonical "first of next UTC month" reference.
  const startTimeUnix = parseStartUnix(input)
  const referenceUnixSeconds = startTimeUnix ?? now ?? defaultReferenceUnixSeconds()

  const startUnlockPercent = finiteOrZero(input.startUnlockPercent)
  const cliffUnlockPercent = finiteOrZero(input.cliffUnlockPercent)

  const cliffSeconds = durationToSeconds({
    interval: input.interval,
    value: finiteOrZero(input.cliffValue),
    unit: input.cliffUnit,
    referenceUnixSeconds,
  })
  // The post-cliff span is anchored at the cliff end, matching the on-chain build.
  const vestingSeconds = durationToSeconds({
    interval: input.interval,
    value: finiteOrZero(input.durationValue),
    unit: input.durationUnit,
    referenceUnixSeconds: referenceUnixSeconds + cliffSeconds,
  })

  return {
    displayName: input.displayName ?? input.name,
    description: input.description,
    interval: input.interval,
    cliffSeconds,
    vestingSeconds,
    startUnlockPercent,
    cliffUnlockPercent,
    isFixedStart: input.useFixedStartTime,
    startTimeUnix,
    pieceDuration: encodePieceDuration(input.interval),
  }
}

/**
 * Derives the canonical `Schedule` model from a `ScheduleInput`, INCLUDING its
 * derived `code`. The single form-input → rendered-schedule seam; pure, no I/O.
 *
 * The schedule `code` is a lock identity (`deriveScheduleCode`) — same family as
 * the shape kernel — so the weld lives here rather than across a door. `code` is
 * placed first to preserve the exact `Schedule` key order the pre-re-cut
 * `deriveSchedule` produced.
 */
export function deriveSchedule(input: ScheduleInput, now?: bigint): Schedule {
  return {
    code: deriveScheduleCode(input),
    ...deriveScheduleShape(input, now),
  }
}
