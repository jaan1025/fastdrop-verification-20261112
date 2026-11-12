"use client"
import { useCallback, useState } from "react"
import { type UiWallet, type UiWalletAccount, useConnect } from "@wallet-standard/react"
import { usePersistFn } from "@repo/shared/hooks"
import { useSolana } from "../components/solana-provider"
import { useDisconnect } from "./use-disconnect"

/**
 * Headless wallet-list view-model — the connect-modal LOGIC without any JSX.
 * Extracted from the legacy `SolanaConnectModal` so the both-chain composition
 * root (`@repo/airdrop-app-shared`) renders the dialog UI while this package
 * stays UI-free (charter ⊖ `@repo/ui`). The app maps these rows + handlers onto
 * its own dialog.
 */

export interface SolanaWalletRow {
  wallet: UiWallet
  /** Connect attempt is in flight for this wallet. */
  isConnecting: boolean
  /** Initiate connection; resolves the selected account into provider state. */
  connect: () => Promise<void>
}

export interface UseSolanaWalletListResult {
  rows: SolanaWalletRow[]
  /** The currently-selected wallet, when connected. */
  selectedWallet: UiWallet | null
  selectedAccount: UiWalletAccount | null
  isConnected: boolean
  /** Last connection error message, or null. */
  connectionError: string | null
  /** Disconnect the connected wallet. */
  disconnect: () => Promise<void>
  isDisconnecting: boolean
}

const useWalletRow = (
  wallet: UiWallet,
  onConnected: (wallet: UiWallet, account: UiWalletAccount) => void,
  onError: (error: unknown) => void,
): SolanaWalletRow => {
  const [isConnecting, connectFn] = useConnect(wallet)
  const connect = usePersistFn(async () => {
    if (isConnecting) return
    try {
      const accounts = await connectFn()
      const firstAccount = accounts?.[0]
      if (!firstAccount) throw new Error("Wallet returned no accounts")
      onConnected(wallet, firstAccount)
    } catch (error) {
      onError(error)
    }
  })
  return { wallet, isConnecting, connect }
}

export const useSolanaWalletList = (): UseSolanaWalletListResult => {
  const {
    wallets,
    selectedWallet,
    selectedAccount,
    setWalletAndAccount,
    isConnected,
    closeConnectModal,
  } = useSolana()
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const onConnected = useCallback(
    (wallet: UiWallet, account: UiWalletAccount) => {
      setWalletAndAccount(wallet, account)
      setConnectionError(null)
      closeConnectModal()
    },
    [setWalletAndAccount, closeConnectModal],
  )

  const onError = useCallback((error: unknown) => {
    setConnectionError(error instanceof Error ? error.message : String(error))
  }, [])

  // `wallets` is a stable-length list from the provider; one hook per row is a
  // legitimate map of hooks (the wallet set does not reorder within a render).
  const rows = wallets.map((wallet) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useWalletRow(wallet, onConnected, onError),
  )

  const [isDisconnecting, disconnect] = useDisconnect(selectedWallet)

  return {
    rows,
    selectedWallet,
    selectedAccount,
    isConnected,
    connectionError,
    disconnect,
    isDisconnecting,
  }
}
