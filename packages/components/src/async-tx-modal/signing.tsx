import type { ReactNode } from "react"
import { Loader2Icon } from "lucide-react"
import { useAsyncTxPhase } from "./context"

export interface AsyncTxModalSigningProps {
  /** Spinner label during `signing`. */
  signingLabel?: ReactNode
  /** Spinner label during `confirming`. */
  confirmingLabel?: ReactNode
  /** Chain-specific detail line under the confirming spinner. */
  confirmingDetail?: ReactNode
}

/**
 * `AsyncTxModal.Signing` — the in-flight single-spinner part (signing +
 * confirming phases). For the per-step checklist variant, use
 * `<AsyncTxModal.Steps>` instead (the two are mutually exclusive at the call
 * site). Mounts only when the active phase is `signing` or `confirming`.
 */
export function AsyncTxModalSigning({
  signingLabel = "Submitting transaction…",
  confirmingLabel = "Waiting for confirmation…",
  confirmingDetail,
}: AsyncTxModalSigningProps) {
  const { state } = useAsyncTxPhase()
  if (state !== "signing" && state !== "confirming") return null

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <Loader2Icon className="text-primary size-8 animate-spin" />
      <p className="text-muted-foreground text-sm">
        {state === "confirming" ? confirmingLabel : signingLabel}
      </p>
      {state === "confirming" && confirmingDetail && (
        <p className="text-muted-foreground text-xs">{confirmingDetail}</p>
      )}
    </div>
  )
}
