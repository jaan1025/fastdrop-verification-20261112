import { useAccount, useDisconnect, useSwitchChain } from "wagmi"
import { useAppKit } from "@reown/appkit/react"
import { chainDisplayName } from "../chain"
import type { WalletControlViewState } from "./wallet-control-view"

export interface EvmWalletState {
  state: WalletControlViewState
  onConnect: () => void
  onDisconnect: () => void
  onSwitchChain: () => void
}

/**
 * EVM `-evm` wallet adapter: maps wagmi (the single source of truth) into a
 * `WalletControlView` state + connect/disconnect/switch actions, with AppKit
 * used only to open the connect modal. Returns a disconnected state until the
 * account resolves (never an unvalidated control).
 *
 * State drives off wagmi only — never reads AppKit account-state hooks so the
 * source of truth stays singular.
 */
export function useEvmWalletState(expectedChainId: number): EvmWalletState {
  const { address, chainId: connectedChainId, isConnected } = useAccount()
  const { open } = useAppKit()
  const { disconnectAsync } = useDisconnect()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()

  const state: WalletControlViewState =
    !isConnected || !address
      ? { status: "disconnected" }
      : connectedChainId !== expectedChainId
        ? {
            status: "wrong-chain",
            targetChainName: chainDisplayName(String(expectedChainId)),
            switching: isSwitching,
          }
        : { status: "connected", chainId: String(expectedChainId), address }

  return {
    state,
    onConnect: () => void open(),
    onDisconnect: () => void disconnectAsync(),
    onSwitchChain: () => void switchChainAsync({ chainId: expectedChainId }).catch(() => {}),
  }
}
