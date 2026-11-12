"use client"
import { useAccount, useAccountEffect, useDisconnect } from "wagmi"

// Account-state read surface for the app composition root. The app cannot import
// `wagmi` directly (strict pnpm isolation), so these thin hooks re-expose the
// connected address, the disconnect action, and the connect/disconnect effect the
// wallet leaf needs. Chain-specific imports stay behind this `-evm` leaf.

export interface WalletAccount {
  /** Connected wallet address, or undefined when disconnected. */
  address: `0x${string}` | undefined
  /** Whether a wallet is currently connected. */
  isConnected: boolean
  /** The connected chain id, if any. */
  chainId: number | undefined
}

/** The connected wallet address + connection state (wagmi `useAccount`). */
export const useWalletAccount = (): WalletAccount => {
  const { address, isConnected, chainId } = useAccount()
  return { address: address as `0x${string}` | undefined, isConnected, chainId }
}

/** The disconnect action (wagmi `useDisconnect`). */
export const useWalletDisconnect = (): {
  disconnectAsync: () => Promise<void>
} => {
  const { disconnectAsync } = useDisconnect()
  return { disconnectAsync: async () => void (await disconnectAsync()) }
}

export interface WatchAccountHandlers {
  onConnect?: (params: { address: `0x${string}` }) => void
  onDisconnect?: () => void
}

/**
 * Fire on wallet connect / disconnect (wagmi `useAccountEffect`). Used to trigger
 * auto sign-in the moment a wallet connects.
 */
export const useWatchAccount = (handlers: WatchAccountHandlers): void => {
  useAccountEffect({
    onConnect: ({ address }) => handlers.onConnect?.({ address: address as `0x${string}` }),
    onDisconnect: () => handlers.onDisconnect?.(),
  })
}
