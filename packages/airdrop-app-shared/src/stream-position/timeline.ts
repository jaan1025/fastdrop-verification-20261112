import { addUtcDuration, parseUtcDate } from "@repo/shared/utils"
import type { TimeUnit } from "@repo/airdrop-base/schedule"

/**
 * Resolves a vesting stream's Cliff-End / Full-unlock DISPLAY instants. On-chain
 * times win exactly; else estimate from start + schedule spans via the shared
 * UTC `addUtcDuration` (calendar-approximate). DISPLAY-ONLY — never substitute
 * these for the protocol-exact `intervals/seconds.ts` math (analysis M3).
 */

export interface ScheduleSpans {
  cliffValue: number
  cliffUnit: TimeUnit
  durationValue: number
  durationUnit: TimeUnit
}

export interface ScheduleTimeline {
  /** Cliff-end instant; null when no cliff or no resolved start. */
  cliffEnd: Date | null
  /** Full-unlock instant; null when there's no resolved start. */
  endDate: Date | null
}

export function deriveScheduleTimeline(
  start: Date | null,
  spans: ScheduleSpans,
  onChain?: { cliffTime?: number; endTime?: number },
): ScheduleTimeline {
  const hasCliff = spans.cliffValue > 0

  if (onChain?.endTime) {
    return {
      cliffEnd: hasCliff && onChain.cliffTime ? parseUtcDate(onChain.cliffTime) : null,
      endDate: parseUtcDate(onChain.endTime),
    }
  }

  if (!start || Number.isNaN(start.getTime())) {
    return { cliffEnd: null, endDate: null }
  }

  const cliffEnd = hasCliff ? addUtcDuration(start, spans.cliffValue, spans.cliffUnit) : null
  // `durationValue` is the post-cliff span, so the end builds on the cliff end.
  const endDate = addUtcDuration(cliffEnd ?? start, spans.durationValue, spans.durationUnit)
  return { cliffEnd, endDate }
}
