import { useCallback, type ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { AsyncTxPhaseProvider, type AsyncTxModalState, type AsyncTxStep } from "./context"
import { useFreezeOnExit } from "./use-freeze-on-exit"
import { AsyncTxModalConfirm } from "./confirm"
import { AsyncTxModalSigning } from "./signing"
import { AsyncTxModalSteps } from "./steps"
import { AsyncTxModalSuccess } from "./success"
import { AsyncTxModalError } from "./error"

export interface AsyncTxModalProps {
  /** Whether the dialog is open. */
  open: boolean
  /** Open-state setter; close is blocked while signing/confirming. */
  onOpenChange: (open: boolean) => void
  /** Dialog title. */
  title: ReactNode
  /** Dialog description. */
  description: ReactNode
  /** Current lifecycle phase driving which mounted part renders. */
  state: AsyncTxModalState
  /** The phase parts (`<AsyncTxModal.Confirm>` …); each renders only when its
   *  phase matches the active `state`. */
  children: ReactNode
}

interface AsyncTxModalComponent {
  (props: AsyncTxModalProps): ReactNode
  Confirm: typeof AsyncTxModalConfirm
  Signing: typeof AsyncTxModalSigning
  Steps: typeof AsyncTxModalSteps
  Success: typeof AsyncTxModalSuccess
  Error: typeof AsyncTxModalError
}

/**
 * The AsyncTxModal compound root — Dialog shell + close-lock + phase context.
 * Realises `@repo/patterns/async-tx-modal`. Replaces the legacy config-driven
 * mega-component (~20 optional props, one-of-five-bodies switch) with a compound
 * where each call site mounts only the phase parts it has:
 *
 * ```tsx
 * <AsyncTxModal open={open} onOpenChange={setOpen} title="…" description="…" state={state}>
 *   <AsyncTxModal.Confirm actionLabel="Revoke" onConfirm={run}>{reviewBody}</AsyncTxModal.Confirm>
 *   <AsyncTxModal.Signing />
 *   <AsyncTxModal.Success explorerUrl={url} />
 *   <AsyncTxModal.Error onRetry={run} errorMessage={err} />
 * </AsyncTxModal>
 * ```
 *
 * The shell blocks close while `state` is `signing`/`confirming`, freezes the
 * rendered phase during the exit animation (so a terminal body never flashes
 * back to confirm mid-close), and provides `{ state, locked, requestClose }` via
 * phase context.
 */
export const AsyncTxModal: AsyncTxModalComponent = ({
  open,
  onOpenChange,
  title,
  description,
  state,
  children,
}) => {
  const locked = state === "signing" || state === "confirming"
  // Freeze the phase used for rendering during the exit animation — callers
  // reset their state to "confirm" inside `onOpenChange(false)`, and without
  // freezing the terminal body would flash to the confirm body while Radix
  // unmounts the DialogContent.
  const renderState = useFreezeOnExit(open, state)

  const requestClose = useCallback(() => {
    if (locked) return
    onOpenChange(false)
  }, [locked, onOpenChange])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Block close while in flight (ESC / overlay click).
        if (!next && locked) return
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AsyncTxPhaseProvider value={{ state: renderState, locked, requestClose }}>
          {children}
        </AsyncTxPhaseProvider>
      </DialogContent>
    </Dialog>
  )
}

AsyncTxModal.Confirm = AsyncTxModalConfirm
AsyncTxModal.Signing = AsyncTxModalSigning
AsyncTxModal.Steps = AsyncTxModalSteps
AsyncTxModal.Success = AsyncTxModalSuccess
AsyncTxModal.Error = AsyncTxModalError
