import { useCallback } from "react"
import { useDisconnect, useEnsureWalletConnected, useSolana } from "@repo/chain-solana-kit/react"
import type { WalletControlViewState } from "./wallet-control-view"

export interface SolanaWalletState {
  state: WalletControlViewState
  onConnect: () => void
  onDisconnect: () => void
}

/**
 * Solana `-solana` wallet adapter: maps `@repo/chain-solana-kit` connection state
 * into a `WalletControlView` state + connect/disconnect actions. No
 * "wrong-cluster" state: clusters are route-driven (`SolanaRootProvider` reads
 * the active project's chainId), and wallet-standard wallets expose no
 * dApp-callable cluster switch.
 */
export function useSolanaWalletState(solanaChainId: string): SolanaWalletState {
  const { selectedWallet, selectedAccount, isConnected } = useSolana()
  const { ensureWalletConnected } = useEnsureWalletConnected()
  // `useDisconnect` returns `[isDisconnecting, disconnect]` and no-ops on a null
  // wallet; safe to call with the (possibly null) selectedWallet — we only
  // surface the disconnect action on the connected branch.
  const [, disconnect] = useDisconnect(selectedWallet)

  const onConnect = useCallback(() => {
    // `ensureWalletConnected` rejects on cancel; swallow here since the user
    // explicitly closed the modal — no toast needed for an intentional close.
    void ensureWalletConnected().catch(() => {})
  }, [ensureWalletConnected])

  const state: WalletControlViewState =
    !isConnected || !selectedAccount
      ? { status: "disconnected" }
      : { status: "connected", chainId: solanaChainId, address: selectedAccount.address }

  return {
    state,
    onConnect,
    onDisconnect: () => void disconnect(),
  }
}
