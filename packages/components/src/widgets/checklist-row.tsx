import type { ReactNode } from "react"
import { Check, Minus } from "lucide-react"

import { Spinner } from "@repo/ui/components/spinner"
import { cn } from "@repo/ui/lib/utils"

/**
 * ChecklistRow — the row unit of a checklist runner (Figma "Signal", node
 * 252:3274). A leading 20px status circle + label/sublabel + an optional
 * right-aligned status chip, laid out as a justify-between row.
 *
 * Four authored statuses drive the leading circle:
 *  - `done`     — solid foreground circle with a check glyph
 *  - `running`  — 1px ring with a spinner inside (work in progress)
 *  - `pending`  — empty 1px ring (not started)
 *  - `skipped`  — muted ring with a minus glyph
 *
 * This is the single row that a checklist runner repeats; it is intentionally
 * standalone and content-neutral. The optional `chip` slot is generic — callers
 * pass any node (e.g. a tinted status pill like "Done · 1.6s"). Square radius;
 * the circle and chip are the only rounded shapes by design.
 */

type ChecklistStatus = "done" | "running" | "pending" | "skipped"

type ChecklistRowProps = {
  /** Primary label (Funnel Sans Medium 14/20). */
  label: ReactNode
  /** Optional secondary line below the label (Funnel Sans Regular 12/16, muted). */
  sublabel?: ReactNode
  /** Leading-circle state. Defaults to `pending`. */
  status?: ChecklistStatus
  /** Optional right-aligned slot — typically a tinted status pill. */
  chip?: ReactNode
  className?: string
}

function StatusCircle({ status }: { status: ChecklistStatus }) {
  if (status === "done") {
    return (
      <span
        className="bg-foreground text-background flex size-5 shrink-0 items-center justify-center rounded-full"
        aria-hidden
      >
        <Check className="size-4" strokeWidth={2.5} />
      </span>
    )
  }
  if (status === "running") {
    return (
      <span
        className="border-border text-primary flex size-5 shrink-0 items-center justify-center rounded-full border"
        aria-hidden
      >
        <Spinner className="size-3" />
      </span>
    )
  }
  if (status === "skipped") {
    return (
      <span
        className="border-border text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full border"
        aria-hidden
      >
        <Minus className="size-3" strokeWidth={2.5} />
      </span>
    )
  }
  return <span className="border-border size-5 shrink-0 rounded-full border" aria-hidden />
}

const STATUS_LABEL: Record<ChecklistStatus, string> = {
  done: "Done",
  running: "In progress",
  pending: "Pending",
  skipped: "Skipped",
}

function ChecklistRow({ label, sublabel, status = "pending", chip, className }: ChecklistRowProps) {
  return (
    <div
      data-slot="checklist-row"
      data-status={status}
      role="listitem"
      className={cn("flex items-center justify-between gap-3", className)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <StatusCircle status={status} />
        <span className="sr-only">{STATUS_LABEL[status]}:</span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span
            className={cn(
              "type-body-md truncate",
              status === "pending" || status === "skipped"
                ? "text-muted-foreground"
                : "text-foreground",
            )}
          >
            {label}
          </span>
          {sublabel ? (
            <span className="type-caption text-muted-foreground truncate">{sublabel}</span>
          ) : null}
        </div>
      </div>
      {chip ? <div className="shrink-0">{chip}</div> : null}
    </div>
  )
}

export { ChecklistRow }
export type { ChecklistRowProps, ChecklistStatus }
