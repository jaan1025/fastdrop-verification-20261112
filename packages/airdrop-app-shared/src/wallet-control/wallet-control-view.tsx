import type { ReactNode } from "react"
import { AlertTriangleIcon } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { ConnectButton } from "./connect-button"
import { ConnectedWallet } from "./connected-wallet"

/** The rendered state, produced by the chain adapters. */
export type WalletControlViewState =
  | { status: "disconnected" }
  | { status: "wrong-chain"; targetChainName: string; switching: boolean }
  | { status: "connected"; chainId: string | undefined; address: string }

export interface WalletControlViewProps {
  /** Which state to render. */
  state: WalletControlViewState
  /** Opens the connect modal (adapter owns which ecosystem). */
  onConnect: () => void
  /** Disconnects (adapter-owned). */
  onDisconnect: () => void
  /** Switch to the expected chain (EVM wrong-chain only). */
  onSwitchChain?: () => void
  /** Override the connect-button label. */
  connectLabel?: ReactNode
}

/**
 * Chain-free presentational wallet-control state machine — the single rendering
 * home all three chain adapters (EVM, Solana, dual) feed. Names NO chain SDK.
 *   - disconnected            → "Connect wallet" button
 *   - connected + wrong chain → warning pill + "Switch to {chain}" (EVM only)
 *   - connected               → address pill (chain icon + truncated address)
 */
export function WalletControlView({
  state,
  onConnect,
  onDisconnect,
  onSwitchChain,
  connectLabel,
}: WalletControlViewProps) {
  if (state.status === "disconnected") {
    return <ConnectButton onClick={onConnect} label={connectLabel} />
  }

  if (state.status === "wrong-chain") {
    return (
      <div className="border-destructive/30 bg-destructive/5 text-destructive inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs">
        <AlertTriangleIcon className="size-3.5" />
        <span>Wrong network</span>
        <Button
          variant="destructive"
          size="sm"
          className="h-5 px-2 text-[11px]"
          disabled={state.switching}
          onClick={onSwitchChain}
        >
          Switch to {state.targetChainName}
        </Button>
      </div>
    )
  }

  return (
    <ConnectedWallet chainId={state.chainId} address={state.address} onDisconnect={onDisconnect} />
  )
}
