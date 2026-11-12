import { useEffect, useRef } from "react"
import { useAccount, useAccountEffect, useDisconnect } from "wagmi"
import { useAppKit, useAppKitState } from "@reown/appkit/react"
import { usePersistFn } from "@repo/shared/hooks"

export interface EnsureWalletConnectedResult {
  address: string
}

export interface EnsureWalletConnectedOptions {
  /**
   * Force a fresh wallet selection: disconnect the live wallet first, then open
   * the picker so the user can switch wallet/account. The login flow opts in;
   * transaction preflight leaves it `false` to reuse the connected wallet.
   */
  forceReconnect?: boolean
}

export interface UseEnsureWalletConnectedResult {
  ensureWalletConnected: (
    options?: EnsureWalletConnectedOptions,
  ) => Promise<EnsureWalletConnectedResult>
}

type Deferred = {
  resolve: (address: string) => void
  reject: (error: Error) => void
}

const GRACE_MS = 300

// Opens the AppKit modal (if needed) and awaits the connection in a single
// promise. The prior open() + useAccountEffect dance dropped the second click
// because AppKit's open() resolves when the modal *opens* (not closes), so any
// post-open() timeout always fired before the user picked a wallet. Here we
// track close via useAppKitState().open transitioning true → false.
export const useEnsureWalletConnected = (): UseEnsureWalletConnectedResult => {
  const { open } = useAppKit()
  const { open: isModalOpen } = useAppKitState()
  const { address } = useAccount()
  const { disconnectAsync } = useDisconnect()

  const addressRef = useRef(address)
  addressRef.current = address

  const deferredRef = useRef<Deferred | null>(null)
  // True while a forceReconnect tears down the live session before re-prompting.
  // The disconnect we trigger fires onDisconnect; without this guard that
  // callback would reject the very promise the caller is awaiting.
  const reconnectingRef = useRef(false)

  useAccountEffect({
    onConnect: ({ address: addr }) => {
      reconnectingRef.current = false
      if (deferredRef.current) {
        deferredRef.current.resolve(addr)
        deferredRef.current = null
      }
    },
    onDisconnect: () => {
      // Expected teardown during a forceReconnect — keep waiting for the
      // re-connect instead of rejecting.
      if (reconnectingRef.current) return
      if (deferredRef.current) {
        deferredRef.current.reject(new Error("Wallet disconnected"))
        deferredRef.current = null
      }
    },
  })

  // Modal close (true → false). Give wagmi a short window to surface the
  // address from a just-confirmed connect; if it's still absent, reject as
  // cancelled so the calling trigger() can exit its pending state.
  const wasOpenRef = useRef(isModalOpen)
  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isModalOpen
    if (!wasOpen || isModalOpen) return
    const pending = deferredRef.current
    if (!pending) return
    const timer = setTimeout(() => {
      if (deferredRef.current !== pending) return
      deferredRef.current = null
      reconnectingRef.current = false
      if (addressRef.current) {
        pending.resolve(addressRef.current)
      } else {
        pending.reject(new Error("Wallet connection cancelled"))
      }
    }, GRACE_MS)
    return () => clearTimeout(timer)
  }, [isModalOpen])

  const ensureWalletConnected = usePersistFn(async (options?: EnsureWalletConnectedOptions) => {
    const forceReconnect = options?.forceReconnect ?? false

    if (!forceReconnect && addressRef.current) {
      return { address: addressRef.current }
    }

    deferredRef.current?.reject(new Error("Wallet connection superseded"))
    deferredRef.current = null

    // Tear down the live session so AppKit opens on the wallet picker (not the
    // account view), letting the user pick a different wallet/account.
    if (forceReconnect && addressRef.current) {
      reconnectingRef.current = true
      try {
        await disconnectAsync()
      } catch {
        // Re-prompt regardless of how the disconnect settled.
      }
    }

    return new Promise<EnsureWalletConnectedResult>((resolve, reject) => {
      const pending: Deferred = {
        resolve: (addr) => resolve({ address: addr }),
        reject,
      }
      deferredRef.current = pending

      open({ view: "Connect" }).catch((err) => {
        if (deferredRef.current !== pending) return
        deferredRef.current = null
        reconnectingRef.current = false
        pending.reject(err instanceof Error ? err : new Error(String(err)))
      })
    })
  })

  return { ensureWalletConnected }
}
