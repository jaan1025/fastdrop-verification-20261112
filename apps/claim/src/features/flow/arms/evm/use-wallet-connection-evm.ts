import {
  useEnsureWalletConnected,
  useWalletAccount,
  useWalletDisconnect,
} from "@repo/chain-evm-kit/react"
import { usePersistFn } from "@repo/shared/hooks"

import { type ArmConnection } from "../claim-arm-context"

// EVM wallet connection for the claim flow (mono's `ConnectEVM` + AppKit).
// Connect opens the AppKit modal; `forceReconnect` when already connected mirrors
// mono's re-open behaviour. Single-chain leaf (`-evm`) — the wagmi/AppKit hooks
// live only in the EVM arm chunk.
export const useWalletConnectionEvm = (): ArmConnection => {
  const { address } = useWalletAccount()
  const { ensureWalletConnected } = useEnsureWalletConnected()
  const { disconnectAsync } = useWalletDisconnect()

  const connect = usePersistFn(async () => {
    try {
      await ensureWalletConnected({ forceReconnect: !!address })
    } catch {
      // Cancelled / superseded connects are user-driven — swallow silently.
    }
  })

  const disconnect = usePersistFn(async () => {
    await disconnectAsync()
  })

  return { chainKind: "evm", address, connect, disconnect }
}
