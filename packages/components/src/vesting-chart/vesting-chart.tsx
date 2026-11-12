import { ActivityIcon } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/chart"
import { parseUtcDate } from "@repo/shared/utils"
import { scheduleToCurve, type CurvePoint } from "./curve"
import { type Schedule } from "@repo/airdrop-base/schedule"

export interface VestingChartProps {
  /** The vesting schedule whose unlock curve is drawn. The kernel derives the
   *  curve points (+ total/cliff/tail span) from it; this widget only plots. */
  schedule: Schedule
  /** Start timestamp; with `showProgress`, anchors the "Now" reference line. */
  startTime?: string | null
  /** When true and `startTime` resolves, draw the "Now · X%" line. */
  showProgress?: boolean
}

const chartConfig = {
  unlocked: {
    label: "Unlocked %",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

const SECONDS_PER_DAY = 86_400

/**
 * Padding past `totalDays` so the chart shows a flat "fully unlocked" tail past
 * the vesting end (the plateau the legacy dashboard always trailed with), rather
 * than the curve ending flush against the right edge. ~15% of duration, floored
 * at 2 days, capped at 60 (don't push a 1-year schedule out by a quarter).
 */
function vestingTailDays(totalDays: number): number {
  return Math.min(60, Math.max(2, Math.round(totalDays * 0.15)))
}

/** A plotted point: day on the X axis, cumulative unlocked % on the Y axis. */
interface PlotPoint {
  day: number
  unlocked: number
}

function toPlotPoints(points: CurvePoint[]): PlotPoint[] {
  return points.map((p) => ({
    day: Number(p.tSeconds) / SECONDS_PER_DAY,
    unlocked: Math.round(p.unlockedFraction * 1000) / 10,
  }))
}

/**
 * Unlocked % on the drawn curve at a (fractional) day — linear interpolation
 * between the bracketing plotted points. Reads the % off the rendered line so
 * the "Now · X%" label always sits exactly on the curve (a plotting concern, not
 * protocol math).
 */
function plotUnlockedAt(points: PlotPoint[], day: number): number {
  if (points.length === 0) return 0
  if (day <= points[0].day) return points[0].unlocked
  const last = points[points.length - 1]
  if (day >= last.day) return last.unlocked
  for (let i = points.length - 2; i >= 0; i--) {
    if (points[i].day <= day) {
      const a = points[i]
      const b = points[i + 1]
      return b.day === a.day
        ? b.unlocked
        : a.unlocked + ((b.unlocked - a.unlocked) * (day - a.day)) / (b.day - a.day)
    }
  }
  return points[0].unlocked
}

/**
 * Recharts area chart of cumulative unlocked % over days for a vesting schedule,
 * with optional cliff + "Now · X%" reference lines. The ONE canonical copy
 * (deduped from the identical vesting-console + vesting-portal copies). Curve
 * math lives in `./curve` (`scheduleToCurve`) — this widget
 * only plots `CurvePoint[]` and reads off the rendered line.
 */
export function VestingChart({ schedule, startTime, showProgress }: VestingChartProps) {
  const curve = scheduleToCurve(schedule)
  const totalSeconds = Number(schedule.cliffSeconds + schedule.vestingSeconds)
  const cliffDays = Number(schedule.cliffSeconds) / SECONDS_PER_DAY
  const totalDays = totalSeconds / SECONDS_PER_DAY
  const initialUnlocked = schedule.startUnlockPercent + schedule.cliffUnlockPercent

  // Edge case: zero-duration / immediate-unlock schedule. Recharts renders
  // axes-only on empty data, which reads as "loading / broken" — show an
  // explicit state instead.
  if (totalDays <= 0) {
    return (
      <div className="text-muted-foreground flex h-[240px] w-full flex-col items-center justify-center gap-2 text-sm">
        <ActivityIcon className="size-5" />
        <p>
          {initialUnlocked >= 100
            ? "100% unlocked immediately — no vesting curve"
            : "Schedule has no duration set"}
        </p>
      </div>
    )
  }

  const xMax = totalDays + vestingTailDays(totalDays)
  const chartData = toPlotPoints(curve)
  // Extend the curve flat to xMax so the chart shows the "fully unlocked" plateau.
  const lastUnlocked = chartData[chartData.length - 1]?.unlocked ?? 0
  if (xMax > totalDays) {
    chartData.push({ day: xMax, unlocked: lastUnlocked })
  }

  // "Now" reference: days elapsed since `startTime`. Kept FRACTIONAL so the
  // marker positions exactly on the continuous numeric day scale.
  let nowDay: number | null = null
  if (showProgress && startTime) {
    const start = parseUtcDate(startTime).getTime()
    if (!Number.isNaN(start)) {
      const elapsedDays = (Date.now() - start) / 86_400_000
      if (elapsedDays >= 0 && elapsedDays <= totalDays) {
        nowDay = elapsedDays
      }
    }
  }
  const nowPercent = nowDay !== null ? Math.round(plotUnlockedAt(chartData, nowDay)) : null

  return (
    <ChartContainer config={chartConfig} className="aspect-[5/2] min-h-[240px] w-full">
      <AreaChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="day"
          type="number"
          domain={[0, xMax || 1]}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `${Math.round(value)}d`}
          className="text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `${value}%`}
          className="text-xs"
          domain={[0, 100]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `${value}%`}
              // Read the day off the hovered datum, not recharts' `label` — the
              // staircase has duplicate x values per riser, which makes the
              // numeric-axis `label` unreliable (it rendered "Day NaN").
              labelFormatter={(_label, payload) =>
                `Day ${Math.round(
                  Number((payload?.[0]?.payload as { day?: number } | undefined)?.day ?? 0),
                )}`
              }
            />
          }
        />
        {cliffDays > 0 && (
          <ReferenceLine
            x={cliffDays}
            stroke="var(--color-muted-foreground)"
            strokeDasharray="4 4"
            label={{
              value: "Cliff",
              position: "insideTopRight",
              fill: "var(--color-muted-foreground)",
              fontSize: 11,
              offset: 6,
            }}
          />
        )}
        {nowDay !== null && (
          <ReferenceLine
            x={nowDay}
            stroke="var(--color-success)"
            strokeDasharray="3 3"
            label={{
              value: nowPercent !== null ? `Now · ${nowPercent}%` : "Now",
              position: "insideTopLeft",
              fill: "var(--color-success)",
              fontSize: 11,
              offset: 6,
            }}
          />
        )}
        <Area
          type="linear"
          dataKey="unlocked"
          fill="var(--color-primary)"
          fillOpacity={0.18}
          stroke="var(--color-primary)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
