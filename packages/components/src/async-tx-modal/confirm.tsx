import type { ReactNode } from "react"
import { Button } from "@repo/ui/components/button"
import { DialogFooter } from "@repo/ui/components/dialog"
import { useAsyncTxPhase } from "./context"

export interface AsyncTxModalConfirmProps {
  /** The entire confirm-state body (review block + notes + warnings). */
  children: ReactNode
  /** Primary action button label. */
  actionLabel: ReactNode
  /** Variant of the action button. */
  actionVariant?: "default" | "destructive"
  /** Disables the confirm action button. */
  actionDisabled?: boolean
  /** Confirm click handler. */
  onConfirm: () => void
}

/**
 * `AsyncTxModal.Confirm` — the confirm-phase part: the caller-owned review body
 * + the primary-action footer (with a Cancel button wired to the root close via
 * context). Mounts only when the active phase is `confirm`. Every prop here is
 * meaningful only to the confirm phase (no cross-phase bleed).
 */
export function AsyncTxModalConfirm({
  children,
  actionLabel,
  actionVariant = "default",
  actionDisabled = false,
  onConfirm,
}: AsyncTxModalConfirmProps) {
  const { state, requestClose } = useAsyncTxPhase()
  if (state !== "confirm") return null

  return (
    <>
      {children}
      <DialogFooter>
        <Button variant="outline" onClick={requestClose}>
          Cancel
        </Button>
        <Button
          variant={actionVariant === "default" ? "primary" : actionVariant}
          onClick={onConfirm}
          disabled={actionDisabled}
        >
          {actionLabel}
        </Button>
      </DialogFooter>
    </>
  )
}
