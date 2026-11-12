import { useAccount, useDisconnect as useEvmDisconnect } from "wagmi"
import { useAppKit } from "@reown/appkit/react"
import { useEcosystem } from "@repo/auth"
import {
  useDisconnect as useSolanaDisconnect,
  useEnsureWalletConnected,
  useSolana,
} from "@repo/chain-solana-kit/react"
import type { WalletControlViewState } from "./wallet-control-view"

export interface DualWalletEntry {
  /** Ecosystem identity (React list key). */
  key: "evm" | "solana"
  /** That ecosystem's view state. */
  state: WalletControlViewState
  /** Open that ecosystem's connect modal. */
  onConnect: () => void
  /** Disconnect that ecosystem. */
  onDisconnect: () => void
}

/**
 * Dual-chain wallet adapter for the portal: reads both ecosystems' connection
 * state + the logged-in `useEcosystem()` and produces a list of per-ecosystem
 * `WalletControlView` states + actions. The legacy `Status` component's inline
 * both-chain re-implementation becomes this one adapter feeding the shared view.
 * Sanctioned both-chain adapter (it is the dual-chain case by definition).
 *
 * When neither ecosystem is connected, returns a single entry whose `onConnect`
 * opens the LOGGED-IN ecosystem's modal (a recipient signs in with one wallet,
 * so the right reconnect target is that identity's chain). When connected,
 * returns one entry per connected ecosystem.
 */
export function useDualWalletState(): DualWalletEntry[] {
  const ecosystem = useEcosystem()
  const { address: evmAddress, chainId: evmChainId, isConnected: isEvmConnected } = useAccount()
  const { selectedWallet, selectedAccount, isConnected: isSolanaConnected, chain } = useSolana()
  const { open } = useAppKit()
  const { ensureWalletConnected: ensureSolanaConnected } = useEnsureWalletConnected()
  const { disconnectAsync: disconnectEvm } = useEvmDisconnect()
  // `useDisconnect` returns `[isDisconnecting, disconnect]` and no-ops on a null
  // wallet; only surfaced on the connected Solana branch.
  const [, disconnectSolana] = useSolanaDisconnect(selectedWallet)

  const showEvm = isEvmConnected && Boolean(evmAddress)
  const showSolana = isSolanaConnected && Boolean(selectedAccount)

  if (!showEvm && !showSolana) {
    // Route to the logged-in ecosystem's wallet modal. `ensureWalletConnected`
    // rejects on user cancel — swallow it. Unknown ecosystem → EVM modal.
    const onConnect =
      ecosystem === "solana"
        ? () => void ensureSolanaConnected().catch(() => {})
        : () => void open()
    return [
      {
        key: ecosystem === "solana" ? "solana" : "evm",
        state: { status: "disconnected" },
        onConnect,
        onDisconnect: () => {},
      },
    ]
  }

  const entries: DualWalletEntry[] = []
  if (showEvm) {
    entries.push({
      key: "evm",
      state: {
        status: "connected",
        chainId: evmChainId ? String(evmChainId) : undefined,
        address: evmAddress!,
      },
      onConnect: () => void open(),
      onDisconnect: () => void disconnectEvm(),
    })
  }
  if (showSolana) {
    entries.push({
      key: "solana",
      state: {
        status: "connected",
        chainId: chain,
        address: selectedAccount!.address,
      },
      onConnect: () => void ensureSolanaConnected().catch(() => {}),
      onDisconnect: () => void disconnectSolana(),
    })
  }
  return entries
}
