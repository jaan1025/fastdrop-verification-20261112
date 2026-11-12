import type { ReactNode } from "react"
import { CheckCircle2Icon, ExternalLinkIcon } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { DialogFooter } from "@repo/ui/components/dialog"
import { useAsyncTxPhase } from "./context"

export interface AsyncTxModalSuccessProps {
  /** Success heading. */
  successTitle?: ReactNode
  /** Recap line under the heading. */
  successRecap?: ReactNode
  /** When set, renders the "View on Explorer" external link. */
  explorerUrl?: string
}

/**
 * `AsyncTxModal.Success` — the success terminal part: success icon + heading +
 * optional recap + optional "View on Explorer" link, plus a Done footer wired to
 * the root close. Mounts only when the active phase is `success`.
 */
export function AsyncTxModalSuccess({
  successTitle = "Transaction submitted",
  successRecap,
  explorerUrl,
}: AsyncTxModalSuccessProps) {
  const { state, requestClose } = useAsyncTxPhase()
  if (state !== "success") return null

  return (
    <>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="bg-success/10 flex size-12 items-center justify-center">
          <CheckCircle2Icon className="text-success size-6" />
        </div>
        <p className="font-display text-base font-medium">{successTitle}</p>
        {successRecap && <p className="text-muted-foreground text-sm">{successRecap}</p>}
        {explorerUrl && (
          <Button asChild variant="link" size="sm" className="gap-1">
            <a href={explorerUrl} target="_blank" rel="noreferrer">
              View on Explorer <ExternalLinkIcon className="size-3" />
            </a>
          </Button>
        )}
      </div>
      <DialogFooter>
        <Button onClick={requestClose}>Done</Button>
      </DialogFooter>
    </>
  )
}
