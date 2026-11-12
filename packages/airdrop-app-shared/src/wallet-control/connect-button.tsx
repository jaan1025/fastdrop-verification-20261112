import type { ReactNode } from "react"
import { WalletIcon } from "lucide-react"
import { Button } from "@repo/ui/components/button"

export interface ConnectButtonProps {
  /** Opens the connect modal. Caller owns which ecosystem's modal opens. */
  onClick: () => void
  /** Button label. Defaults to "Connect wallet". */
  label?: ReactNode
}

/**
 * Presentational connect-wallet button: the disconnected-state affordance shared
 * by the portal's `Status` and the consoles' per-chain controls. The caller
 * wires `onClick` to its own ecosystem's connect primitive (EVM AppKit modal /
 * Solana wallet-standard connect).
 */
export function ConnectButton({ onClick, label = "Connect wallet" }: ConnectButtonProps) {
  return (
    <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs" onClick={onClick}>
      <WalletIcon className="size-3.5" />
      {label}
    </Button>
  )
}
