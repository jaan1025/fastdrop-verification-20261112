import { assertNever } from "@repo/shared/utils"
import { useEvmWalletState } from "./use-evm-wallet-state"
import { useSolanaWalletState } from "./use-solana-wallet-state"
import { useDualWalletState } from "./use-dual-wallet-state"
import { WalletControlView } from "./wallet-control-view"

/** The explicit chain mode (the caller resolves it once via `resolveChainKind`). */
export type WalletControlMode =
  | { kind: "evm"; expectedChainId: number }
  | { kind: "solana"; expectedChainId: string }
  | { kind: "dual" }

export interface WalletControlProps {
  /** The discriminated mode (non-optional; no precedence trap). */
  mode: WalletControlMode
}

/**
 * The single public wallet-control facade for all airdrop apps. Takes a
 * non-optional discriminated `mode` and dispatches via `match(mode.kind)` to one
 * chain adapter feeding the chain-free `WalletControlView`. The kind is carried,
 * never sniffed; the "pass both → silent EVM" trap is gone. Sanctioned
 * both-chain file: a dispatcher facade may name both chains.
 */
export function WalletControl({ mode }: WalletControlProps) {
  // Native switch (not `match`) so each arm narrows `mode` and binds its data —
  // the language's own destructuring-pattern equivalent (see `match` docs).
  switch (mode.kind) {
    case "evm":
      return <EvmWalletControl expectedChainId={mode.expectedChainId} />
    case "solana":
      return <SolanaWalletControl expectedChainId={mode.expectedChainId} />
    case "dual":
      return <DualWalletControl />
    default:
      return assertNever(mode)
  }
}

function EvmWalletControl({ expectedChainId }: { expectedChainId: number }) {
  const { state, onConnect, onDisconnect, onSwitchChain } = useEvmWalletState(expectedChainId)
  return (
    <WalletControlView
      state={state}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      onSwitchChain={onSwitchChain}
    />
  )
}

function SolanaWalletControl({ expectedChainId }: { expectedChainId: string }) {
  const { state, onConnect, onDisconnect } = useSolanaWalletState(expectedChainId)
  return <WalletControlView state={state} onConnect={onConnect} onDisconnect={onDisconnect} />
}

function DualWalletControl() {
  const entries = useDualWalletState()
  return (
    <div className="flex items-center gap-2">
      {entries.map((entry) => (
        <WalletControlView
          key={entry.key}
          state={entry.state}
          onConnect={entry.onConnect}
          onDisconnect={entry.onDisconnect}
        />
      ))}
    </div>
  )
}
