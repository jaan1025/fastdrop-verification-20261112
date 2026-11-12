import type { ReactNode } from "react"
import { XCircleIcon } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { DialogFooter } from "@repo/ui/components/dialog"
import { useAsyncTxPhase } from "./context"

export interface AsyncTxModalErrorProps {
  /** Error heading. */
  errorTitle?: ReactNode
  /** Scrollable error detail. */
  errorMessage?: ReactNode
  /** Retry button label. */
  retryLabel?: ReactNode
  /** Retry button variant. */
  retryVariant?: "default" | "destructive"
  /** Retry click handler. */
  onRetry: () => void
}

/**
 * `AsyncTxModal.Error` — the error terminal part: error icon + heading +
 * scrollable detail + a Cancel (root close) / Try Again footer. Mounts only when
 * the active phase is `error`.
 */
export function AsyncTxModalError({
  errorTitle = "Transaction failed",
  errorMessage,
  retryLabel = "Try Again",
  retryVariant = "default",
  onRetry,
}: AsyncTxModalErrorProps) {
  const { state, requestClose } = useAsyncTxPhase()
  if (state !== "error") return null

  return (
    <>
      <div className="flex w-full min-w-0 flex-col items-center gap-3 py-4 text-center">
        <div className="bg-destructive/10 flex size-12 items-center justify-center">
          <XCircleIcon className="text-destructive size-6" />
        </div>
        <p className="font-display text-base font-medium">{errorTitle}</p>
        {errorMessage && (
          <p className="text-muted-foreground max-h-40 w-full min-w-0 overflow-y-auto text-sm break-words">
            {errorMessage}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={requestClose}>
          Cancel
        </Button>
        <Button variant={retryVariant === "default" ? "primary" : retryVariant} onClick={onRetry}>
          {retryLabel}
        </Button>
      </DialogFooter>
    </>
  )
}
