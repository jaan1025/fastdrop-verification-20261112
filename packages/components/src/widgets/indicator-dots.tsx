import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

/**
 * Indicator Dot Cluster — labeled traffic-light dot pills (Signal Figma 546:1746).
 * Each signal is a bordered white pill: an 8px traffic-light dot
 * (success / warning / danger by `level`) followed by its capitalized caption
 * label. Pills wrap and are separated by a 4px gap. Drives compact health
 * columns such as "Dist · Insider · Sell".
 */
type IndicatorLevel = "positive" | "neutral" | "negative"
type Indicator = { label: string; level: IndicatorLevel }

const dotByLevel: Record<IndicatorLevel, string> = {
  positive: "bg-success",
  neutral: "bg-warning",
  negative: "bg-danger-alert",
}

function IndicatorDots({
  signals,
  className,
  ...props
}: React.ComponentProps<"div"> & { signals: Indicator[] }) {
  return (
    <div
      data-slot="signal-dot-cluster"
      className={cn("flex flex-wrap items-center gap-1", className)}
      {...props}
    >
      {signals.map((signal) => (
        <span
          key={signal.label}
          className="border-border bg-background inline-flex h-[22px] items-center gap-1.5 rounded-full border py-[3px] pr-3 pl-2"
        >
          <span className={cn("size-2 shrink-0 rounded-full", dotByLevel[signal.level])} />
          <span className="type-caption text-muted-foreground capitalize">{signal.label}</span>
        </span>
      ))}
    </div>
  )
}

export { IndicatorDots }
export type { Indicator, IndicatorLevel }
