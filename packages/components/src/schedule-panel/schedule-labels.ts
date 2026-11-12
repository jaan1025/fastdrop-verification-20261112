import type { Schedule } from "@repo/airdrop-base/schedule"
import { formatDurationCadence } from "./duration-cadence"

/** Human label for the total schedule length (cliff + vesting), display-only. */
export function formatScheduleDuration(schedule: Schedule): string {
  // Sub-day spans floor to 0 days and read as "Instant" (subDayLabel defaults to
  // zeroLabel), matching this label's long-standing no-sub-day-branch behavior.
  return formatDurationCadence(schedule.cliffSeconds + schedule.vestingSeconds, {
    zeroLabel: "Instant",
  })
}

/** Human label summarizing start/cliff unlock percents + interval, display-only. */
export function formatUnlockSummary(schedule: Schedule): string {
  const parts: string[] = []
  if (schedule.startUnlockPercent > 0) {
    parts.push(`${schedule.startUnlockPercent}% at TGE`)
  }
  if (schedule.cliffUnlockPercent > 0) {
    parts.push(`${schedule.cliffUnlockPercent}% at cliff`)
  }
  parts.push(`${schedule.interval} thereafter`)
  return parts.join(", ")
}
