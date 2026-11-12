import { Fragment } from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

// Horizontal, LEFT-ALIGNED step row (matches the Signal multi-step shell): each
// step is a square badge with its label inline to the right, joined by short
// fixed-width connectors — the steps cluster to the left rather than stretching
// edge-to-edge. Complete = solid primary + check; current = solid primary +
// number; future = bordered grey. Sharp corners (global --radius: 0).
export function StepIndicator({
  current,
  labels,
  className,
}: {
  current: number
  labels: readonly string[]
  className?: string
}) {
  const total = labels.length
  return (
    <div className={cn("flex w-full items-center gap-3", className)}>
      {labels.map((label, i) => {
        const state = i < current ? "complete" : i === current ? "current" : "future"
        return (
          <Fragment key={label}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center text-sm font-medium",
                  state === "complete" && "bg-primary text-primary-foreground",
                  state === "current" && "bg-primary text-primary-foreground",
                  state === "future" && "border-border text-muted-foreground border",
                )}
              >
                {state === "complete" ? <CheckIcon className="size-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  state === "current" ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={cn("h-0.5 w-12 shrink-0", i < current ? "bg-primary" : "bg-border")}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
