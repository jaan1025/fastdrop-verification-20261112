import { useState } from "react"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { ScrollArea } from "@repo/ui/components/scroll-area"

/** Product-specific copy slotted into the boilerplate terms (the ONE home). */
export type TosCopy = {
  // Product brand the terms govern, e.g. "Clique Vesting Console".
  productName: string
  // Short noun phrase for what the platform is used for, slotted after
  // "...governing your use of the platform for …".
  description: string
  // Noun phrase listing what the platform provides tools for, slotted into
  // Section 1 after "...provides tools for managing …".
  platformCapabilities: string
}

export interface ToSConsentLineProps {
  /** Product-specific ToS copy forwarded to the embedded modal. */
  copy: TosCopy
}

/**
 * The inline "by connecting, you agree to our Terms of Service…" consent line
 * plus the read-only ToS dialog it opens. Agreement is implied by connecting —
 * there is no separate accept-gate on login, so the dialog is purely
 * informational. Owns local open/close state; the legal copy is
 * product-parameterized.
 */
export function ToSConsentLine({ copy }: ToSConsentLineProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <p className="text-muted-foreground text-center text-xs lg:text-start">
        By connecting, you agree to our{" "}
        <button className="text-primary underline underline-offset-4" onClick={() => setOpen(true)}>
          Terms of Service
        </button>{" "}
        and to sign a message to verify wallet ownership.
      </p>
      <TosDialog copy={copy} open={open} onOpenChange={setOpen} />
    </>
  )
}

// Read-only Terms of Service. Purely informational (agreement is implied by
// connecting — see the consent line above); no accept gate.
function TosDialog({
  copy,
  open,
  onOpenChange,
}: {
  copy: TosCopy
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>The terms governing your use of the platform.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] border p-4">
          <div className="text-muted-foreground space-y-4 text-sm">
            <p>
              By using {copy.productName}, you acknowledge and agree to the following terms and
              conditions governing your use of the platform for {copy.description}.
            </p>
            <p className="text-foreground font-medium">1. Platform Usage</p>
            <p>
              {copy.productName} provides tools for managing {copy.platformCapabilities}. You are
              solely responsible for all transactions initiated through this platform.
            </p>
            <p className="text-foreground font-medium">2. Wallet &amp; Key Security</p>
            <p>
              You are responsible for maintaining the security of your wallet credentials and API
              keys. Clique is not liable for unauthorized access resulting from compromised
              credentials.
            </p>
            <p className="text-foreground font-medium">3. On-Chain Transactions</p>
            <p>
              All blockchain transactions are irreversible once confirmed. Ensure you review all
              transaction details before approval. Clique cannot reverse or modify confirmed
              on-chain operations.
            </p>
            <p className="text-foreground font-medium">4. Token Distribution</p>
            <p>
              You warrant that all token distributions comply with applicable laws and regulations.
              Clique provides infrastructure tools and does not provide legal or financial advice.
            </p>
            <p className="text-foreground font-medium">5. Data &amp; Privacy</p>
            <p>
              Wallet addresses and transaction data are stored for operational purposes. On-chain
              data is publicly accessible by nature of blockchain technology.
            </p>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
