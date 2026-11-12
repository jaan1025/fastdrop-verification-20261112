"use client"

import { useScrolledToBottom, type ToSDialogProps } from "@repo/tos-signer-base"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Button } from "@repo/ui/components/button"
import { ToSMarkdown } from "./tos-markdown"

/**
 * Terms-of-Service consent dialog — the canonical implementation of the
 * `ToSDialogProps` slot contract from `@repo/tos-signer-base`. An app maps its
 * headless `ToSSignerHostState` onto these props and passes this widget into
 * the host's dialog slot.
 *
 * Per DESIGN.md §4 the title is text-only (no icon). The Accept button is
 * gated until the user has scrolled the ToS to the bottom — the established
 * legal-consent UX — via the reusable `useScrolledToBottom` gate (which
 * auto-enables when the content is shorter than the scroll viewport).
 */
export function ToSDialog({ open, pending, tosContent = "", onCancel, onConfirm }: ToSDialogProps) {
  // Callback ref: fires when Radix actually mounts the scroll node (whatever the
  // timing), so a short ToS auto-enables Accept and a reused dialog re-gates.
  const { ref: scrollRef, scrolledToBottom } = useScrolledToBottom()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel?.()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="bg-muted/50 max-h-[min(60vh,28rem)] overflow-y-auto border p-4"
        >
          <ToSMarkdown content={tosContent} />
        </div>

        <DialogFooter className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={pending}
            className="order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!scrolledToBottom || pending}
            className="order-1 sm:order-2"
          >
            {pending ? "Signing…" : "Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
