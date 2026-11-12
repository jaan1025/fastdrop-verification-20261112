import type { ReactNode } from "react"
import {
  CheckCircle2Icon,
  CircleIcon,
  CircleDotIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { stepRowStatus, type StepRowStatus } from "./row-status"

export type StepChecklistStep<Step extends string> = {
  id: Step
  label: string
  /** Optional node rendered at the row's trailing edge (e.g. a tx link).
   *  Generic by design — the checklist knows nothing about its content. */
  trailing?: ReactNode
}

export interface StepChecklistProps<Step extends string> {
  steps: readonly StepChecklistStep<Step>[]
  currentStep: Step | null
  completedSteps: readonly Step[]
  error: { step: Step; message: string } | null
  /** Step waiting on user input (rendered distinct from `active`). */
  awaitingStepId?: Step | null
}

function Icon({ status }: { status: StepRowStatus }) {
  switch (status) {
    case "done":
      return <CheckCircle2Icon className="text-success size-5" />
    case "failed":
      return <TriangleAlertIcon className="text-destructive size-5" />
    case "awaiting":
      return <CircleDotIcon className="text-primary size-5" />
    case "active":
      return <Loader2Icon className="text-primary size-5 animate-spin" />
    case "idle":
      return <CircleIcon className="text-muted-foreground/40 size-5" />
  }
}

export function StepChecklist<Step extends string>({
  steps,
  currentStep,
  completedSteps,
  error,
  awaitingStepId = null,
}: StepChecklistProps<Step>) {
  return (
    <ol className="space-y-3">
      {steps.map((step) => {
        const status = stepRowStatus<Step>(step.id, {
          completedSteps,
          currentStep,
          error,
          awaitingStepId,
        })
        const failed = status === "failed"
        return (
          <li key={step.id} className="flex items-start gap-3">
            <span className="mt-0.5 size-5 shrink-0">
              <Icon status={status} />
            </span>
            {/* min-w-0 + break-words: let long tx hashes in an error wrap
                instead of forcing the row past the dialog edge. */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <p
                  className={cn(
                    "text-sm",
                    status === "active" || status === "awaiting"
                      ? "text-foreground font-medium"
                      : status === "done"
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                {step.trailing && <div className="shrink-0">{step.trailing}</div>}
              </div>
              {failed && error && (
                <p className="text-destructive text-xs break-words">{error.message}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
