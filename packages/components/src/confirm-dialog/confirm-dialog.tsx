import type { ReactNode } from "react"
import { Button } from "@repo/ui/components/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog"

export type ConfirmDialogVariant = "default" | "warning" | "destructive"

// Variant mapping — single source of truth, mirrored in the spec.
export const DESCRIPTION_COLOR: Record<ConfirmDialogVariant, string | undefined> = {
  default: undefined,
  warning: "text-warning",
  destructive: "text-destructive",
}

export const ACTION_VARIANT: Record<ConfirmDialogVariant, "primary" | "destructive"> = {
  default: "primary",
  warning: "primary",
  destructive: "destructive",
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  /** Tonal variant. Defaults to "destructive" — the pattern's canonical case. */
  variant?: ConfirmDialogVariant

  /** Imperative question, e.g. "Delete project?". Icons can be composed in. */
  title: ReactNode
  /** States the consequence. For destructive: include "cannot be undone" or equivalent. */
  description: ReactNode

  /**
   * Optional structured context rendered between description and footer,
   * on the dialog's plain background — typically label/value rows
   * referencing what's affected. Per the destructive-confirm spec, this
   * block does NOT get a destructive tint; the tonal weight lives on
   * the description above.
   */
  consequenceBlock?: ReactNode

  /** Action-verb label per spec, e.g. "Delete", "Revoke", "Discard", "Send". */
  actionLabel: ReactNode
  cancelLabel?: ReactNode
  isPending?: boolean
  onConfirm: () => void
}

/**
 * Realises `packages/patterns/src/destructive-confirm/spec.md`. One-shot
 * blocking confirmation modal supporting three tonal variants:
 *
 *   - `default`     — consequential but neutral ("Send invoice?")
 *   - `warning`     — reversible but disruptive ("Discard changes?")
 *   - `destructive` — irreversible ("Revoke stream?")
 *
 * For destructive actions with an async lifecycle (signing → confirming →
 * success / error), use `<AsyncTxModal>` with `actionVariant="destructive"`
 * instead — the AlertDialog role is for confirmation-only flows.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  variant = "destructive",
  title,
  description,
  consequenceBlock,
  actionLabel,
  cancelLabel = "Cancel",
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className={DESCRIPTION_COLOR[variant]}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {consequenceBlock && <div className="space-y-1 text-sm">{consequenceBlock}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isPending}>
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction
            variant={ACTION_VARIANT[variant]}
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
