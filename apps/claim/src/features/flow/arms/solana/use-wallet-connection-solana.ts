import {
  useSolana,
  useSolanaConnectModal,
  useDisconnect as useSolanaDisconnect,
} from "@repo/chain-solana-kit/react"
import { usePersistFn } from "@repo/shared/hooks"

import { type ArmConnection } from "../claim-arm-context"

// Solana wallet connection for the claim flow. Connect opens the Solana connect
// modal (no cluster-switch analogue). `useDisconnect(wallet)` returns a tuple
// `[isDisconnecting, disconnect]`. Single-chain leaf (`-solana`) — the Solana
// wallet hooks live only in the Solana arm chunk.
export const useWalletConnectionSolana = (): ArmConnection => {
  const { selectedAccount, selectedWallet } = useSolana()
  const { openSolanaConnectModal } = useSolanaConnectModal()
  const [, disconnectWallet] = useSolanaDisconnect(selectedWallet)

  const connect = usePersistFn(() => {
    try {
      openSolanaConnectModal()
    } catch {
      // Cancelled / superseded connects are user-driven — swallow silently.
    }
  })

  const disconnect = usePersistFn(async () => {
    await disconnectWallet()
  })

  return {
    chainKind: "solana",
    address: selectedAccount?.address,
    connect,
    disconnect,
  }
}
