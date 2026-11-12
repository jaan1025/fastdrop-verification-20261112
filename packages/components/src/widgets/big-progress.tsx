import { cn } from "@repo/ui/lib/utils"

export interface BigProgressProps {
  /** Completion percentage, 0–100. Clamped to that range. */
  percent: number
  /** Optional muted line below the ticks, e.g. "Estimated time remaining: 5 minutes". */
  caption?: string
  /** Number of vertical ticks the bar is divided into. Defaults to 48. */
  tickCount?: number
  className?: string
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/**
 * BigProgress — a large engine-progress display (Figma 252:3148–3234).
 *
 * A big percentage number (Funnel Display, ~54px) sits above a full-width row
 * of many thin vertical ticks: the first `filled` are solid foreground, the
 * rest are progress-track grey. A muted caption can sit below. Distinct from
 * SegmentedStageBar, which is a tiny inline table-cell indicator — this is a
 * page-level "the engine is working" readout.
 *
 * `filled = round(percent / 100 * tickCount)`.
 */
export function BigProgress({ percent, caption, tickCount = 48, className }: BigProgressProps) {
  const safePercent = clampPercent(percent)
  const ticks = Math.max(1, Math.round(tickCount))
  const filled = Math.round((safePercent / 100) * ticks)

  return (
    <div className={cn("flex flex-col items-start gap-3", className)}>
      <p className="type-display-hero text-foreground tabular-nums">{Math.round(safePercent)}%</p>
      <div
        className="flex h-12 w-full items-stretch gap-0.5"
        role="progressbar"
        aria-valuenow={Math.round(safePercent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {Array.from({ length: ticks }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className={cn(
              "h-full min-w-[6px] flex-1",
              index < filled ? "bg-foreground" : "bg-progress-track",
            )}
          />
        ))}
      </div>
      {caption ? <p className="type-body text-muted-foreground">{caption}</p> : null}
    </div>
  )
}
