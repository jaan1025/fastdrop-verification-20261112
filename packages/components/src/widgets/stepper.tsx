import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

/**
 * Stepper — numbered horizontal pipeline progress (Figma "Signal" top stepper,
 * node 570:16313). Drives the 6-step wizard (Submit → Analyze → Verify → Report
 * → Committee → Monitor). Each step is a 32px SQUARE marker with its label
 * inline to the right; a thin connector line bridges adjacent steps and turns
 * primary once its left step completes. Three authored states: completed
 * (filled + check), active (filled + number), upcoming (1px border, muted).
 */
type StepperStep = { label: string }

function Stepper({
  steps,
  current,
  className,
  ...props
}: React.ComponentProps<"ol"> & { steps: StepperStep[]; current: number }) {
  return (
    <ol data-slot="stepper" className={cn("flex w-full items-center", className)} {...props}>
      {steps.map((step, index) => {
        const state = index < current ? "completed" : index === current ? "active" : "upcoming"
        const isLast = index === steps.length - 1

        return (
          <li
            key={step.label}
            data-state={state}
            className={cn("flex items-center gap-3", !isLast && "flex-1")}
          >
            <span
              className={cn(
                "type-body-md flex size-8 shrink-0 items-center justify-center",
                state === "completed" && "bg-primary text-primary-foreground",
                state === "active" && "bg-primary text-primary-foreground",
                state === "upcoming" && "border-border text-muted-foreground border",
              )}
            >
              {state === "completed" ? <Check className="size-4" /> : index + 1}
            </span>
            <span
              className={cn(
                "type-body-md whitespace-nowrap",
                state === "upcoming" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {step.label}
            </span>
            {!isLast && (
              <span
                className={cn("h-px flex-1", index < current ? "bg-primary" : "bg-progress-track")}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export { Stepper }
export type { StepperStep }
