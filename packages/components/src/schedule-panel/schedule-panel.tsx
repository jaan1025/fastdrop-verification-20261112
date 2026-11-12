import { fromUnixTime } from "date-fns"
import { parseUtcDate } from "@repo/shared/utils"
import { formatDurationCadence } from "./duration-cadence"
import { formatScheduleDuration } from "./schedule-labels"
import { type Schedule } from "@repo/airdrop-base/schedule"
import { DataPanel } from "../data-panel"
import { DetailList, DetailRow } from "../detail-row"
import { ScheduleRef } from "../schedule-ref"
import { TimestampValue } from "../timestamp-value"
import { WalletAddress } from "../wallet-address"

export interface SchedulePanelProps {
  /** The vesting schedule whose configuration is shown. */
  schedule: Schedule
  /** When true, suppress the Schedule code row (used on Schedule Detail where
   *  the code is the page identity). */
  hideCode?: boolean
  /** Override the schedule's own start for the Start At / timeline rows (e.g. a
   *  stream's first-claim time, resolved by the app). */
  startTime?: string | null
  /** Deployed on-chain lock/program address (a deployment artifact, NOT part of
   *  the kernel `Schedule`). When set, renders the `Lock contract` row. */
  lockContract?: string | null
  className?: string
}

function formatType(interval: Schedule["interval"]): string {
  const cadence = interval.charAt(0).toUpperCase() + interval.slice(1)
  // "Linear · Continuous" for continuous unlocks; otherwise just the cadence.
  return interval === "continuous" ? `Linear · ${cadence}` : cadence
}

/** Format a single duration span (Vesting/Cliff rows) via the shared cadence
 *  ladder owned by airdrop-base, with this panel's own low-end labels:
 *  0 → "None", positive sub-day → "< 1 day". */
function formatSeconds(seconds: bigint): string {
  return formatDurationCadence(seconds, {
    zeroLabel: "None",
    subDayLabel: "< 1 day",
  })
}

/** Resolve the schedule's start instant: explicit `startTime` override → the
 *  schedule's own fixed `startTimeUnix` → null (flexible / on first claim). */
function resolveStart(schedule: Schedule, startTime?: string | null): Date | null {
  if (startTime) {
    // A zoneless override → UTC instant; a `Z`/offset string is unaffected. Keeps
    // the rendered Start At in the same UTC the build deploys + TimestampValue shows.
    const d = parseUtcDate(startTime)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (schedule.isFixedStart && schedule.startTimeUnix !== null) {
    return fromUnixTime(Number(schedule.startTimeUnix))
  }
  return null
}

export type ScheduleDetailsProps = Omit<SchedulePanelProps, "className">

/**
 * The schedule's label/value detail rows WITHOUT the surrounding panel — the
 * bare run-of-rows. Use directly when a section already provides its own framing
 * (e.g. nested under a strategy heading); use {@link SchedulePanel} for the
 * tinted, titled "Schedule" panel. Single source of the row set + formatting.
 */
export function ScheduleDetails({
  schedule,
  hideCode,
  startTime,
  lockContract,
}: ScheduleDetailsProps) {
  const startDate = resolveStart(schedule, startTime)
  const endDate =
    startDate !== null
      ? fromUnixTime(
          Math.floor(startDate.getTime() / 1000) +
            Number(schedule.cliffSeconds + schedule.vestingSeconds),
        )
      : null
  const hasCliff = schedule.cliffSeconds > 0n

  return (
    <DetailList>
      {/* Identity */}
      {!hideCode && (
        <DetailRow
          label="Schedule"
          value={<ScheduleRef code={schedule.code} name={schedule.displayName} />}
        />
      )}
      <DetailRow label="Type" value={formatType(schedule.interval)} />

      {/* Start–End phase */}
      <DetailRow
        label="Start At"
        value={
          startDate ? (
            <TimestampValue value={startDate} />
          ) : (
            <span className="text-muted-foreground">On first claim</span>
          )
        }
      />
      <DetailRow
        label="End At"
        value={
          endDate ? (
            <TimestampValue value={endDate} />
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        }
      />
      {hasCliff && startDate && (
        <DetailRow label="Cliff Start At" value={<TimestampValue value={startDate} />} />
      )}

      {/* Durations — the post-cliff vesting span, the cliff, then the full
          (cliff + vesting) total. Total is the real start→end length, NOT the
          vesting-only span the legacy panel mislabelled as "Total". */}
      <DetailRow label="Vesting Duration" value={formatSeconds(schedule.vestingSeconds)} />
      <DetailRow label="Cliff Duration" value={formatSeconds(schedule.cliffSeconds)} />
      <DetailRow label="Total Duration" value={formatScheduleDuration(schedule)} />

      {/* Unlocks */}
      <DetailRow label="Start unlock" value={`${schedule.startUnlockPercent}%`} />
      {hasCliff && <DetailRow label="Cliff unlock" value={`${schedule.cliffUnlockPercent}%`} />}

      {/* Address — the deployed lock/program holding the escrow. */}
      {lockContract && (
        <DetailRow label="Lock contract" value={<WalletAddress address={lockContract} />} />
      )}
    </DetailList>
  )
}

/**
 * Canonical "Schedule" config panel (label/value detail rows) reused on Stream
 * Detail & Schedule Detail across admin + portal. The ONE canonical copy
 * (deduped from the identical vesting-console + vesting-portal copies). Reads the
 * kernel `Schedule` (seconds-based) and lays out rows; duration formatting comes
 * from `@repo/airdrop-base/schedule`.
 */
export function SchedulePanel({
  schedule,
  hideCode,
  startTime,
  lockContract,
  className,
}: SchedulePanelProps) {
  return (
    <DataPanel title="Schedule" className={className}>
      <ScheduleDetails
        schedule={schedule}
        hideCode={hideCode}
        startTime={startTime}
        lockContract={lockContract}
      />
    </DataPanel>
  )
}
