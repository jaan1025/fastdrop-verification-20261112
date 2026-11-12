import { toIsoString } from "@repo/shared/utils"
import type { Schedule } from "@repo/airdrop-base/schedule"
import { DataPanel } from "../data-panel"
import { VestingChart } from "../vesting-chart"

export interface VestingCurvePanelProps {
  /** The vesting schedule whose unlock curve is drawn. */
  schedule: Schedule
  /** Override the schedule's own startTime (e.g. a stream's first-claim time). */
  startTime?: string | null
  /** When true and a startTime resolves, the chart draws a "Now" reference line. */
  showProgress?: boolean
  className?: string
}

/** The schedule's own fixed start as an ISO string, when set. */
function ownStartIso(schedule: Schedule): string | null {
  if (schedule.isFixedStart && schedule.startTimeUnix !== null) {
    return toIsoString(schedule.startTimeUnix)
  }
  return null
}

/**
 * Canonical "Vesting Curve" DataPanel wrapping `VestingChart`, reused on Stream
 * Detail & Schedule Detail across admin + portal. The ONE canonical copy
 * (deduped from the identical vesting-console + vesting-portal copies);
 * co-located with `SchedulePanel`.
 */
export function VestingCurvePanel({
  schedule,
  startTime,
  showProgress,
  className,
}: VestingCurvePanelProps) {
  return (
    <DataPanel title="Vesting Curve" className={className}>
      <VestingChart
        schedule={schedule}
        startTime={startTime ?? ownStartIso(schedule)}
        showProgress={showProgress}
      />
    </DataPanel>
  )
}
