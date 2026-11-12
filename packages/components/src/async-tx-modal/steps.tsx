import { CheckCircle2Icon, CircleIcon, Loader2Icon } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { useAsyncTxPhase, type AsyncTxStep } from "./context"

export interface AsyncTxModalStepsProps {
  /** The ordered in-flight steps. */
  steps: readonly AsyncTxStep[]
  /** Id of the active step within `steps`. */
  currentStepId?: string
}

/**
 * `AsyncTxModal.Steps` — the in-flight per-step checklist variant of the
 * in-flight body (used instead of `<AsyncTxModal.Signing>` when an op has named
 * sub-steps). Steps before `currentStepId` show done, the matching step is
 * active, the rest idle. Mounts only when the active phase is
 * `signing`/`confirming`.
 */
export function AsyncTxModalSteps({ steps, currentStepId }: AsyncTxModalStepsProps) {
  const { state } = useAsyncTxPhase()
  if (state !== "signing" && state !== "confirming") return null
  if (steps.length === 0) return null

  // Active index: the step matching `currentStepId`; fallback keeps a sensible
  // highlight if the caller hasn't set it (first step while signing, last while
  // confirming).
  const matched = steps.findIndex((s) => s.id === currentStepId)
  const activeStepIndex = matched !== -1 ? matched : state === "confirming" ? steps.length - 1 : 0

  return (
    <ol className="space-y-3 py-2">
      {steps.map((step, i) => {
        const status = i < activeStepIndex ? "done" : i === activeStepIndex ? "active" : "idle"
        return (
          <li key={step.id} className="flex items-center gap-3">
            <span className="size-5 shrink-0">
              {status === "done" ? (
                <CheckCircle2Icon className="text-success size-5" />
              ) : status === "active" ? (
                <Loader2Icon className="text-primary size-5 animate-spin" />
              ) : (
                <CircleIcon className="text-muted-foreground/40 size-5" />
              )}
            </span>
            <span
              className={cn(
                "text-sm",
                status === "active"
                  ? "text-foreground font-medium"
                  : status === "done"
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
