import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

/**
 * Segmented Stage Bar — a compact inline pipeline indicator (DESIGN-SYSTEM.md
 * §10, new). Distinct from the Stepper: no numbers, no labels per segment — just
 * `total` thin segments where the first `filled` are primary and the rest are
 * border-grey, with an optional trailing caption. Sized for a table "Stage" cell.
 */
function SegmentedStageBar({
  total,
  filled,
  label,
  className,
  ...props
}: React.ComponentProps<"div"> & { total: number; filled: number; label?: string }) {
  return (
    <div
      data-slot="segmented-stage-bar"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn("h-2 w-1", index < filled ? "bg-primary" : "bg-progress-track")}
          />
        ))}
      </div>
      {label != null && <span className="type-caption text-muted-foreground">{label}</span>}
    </div>
  )
}

export { SegmentedStageBar }
