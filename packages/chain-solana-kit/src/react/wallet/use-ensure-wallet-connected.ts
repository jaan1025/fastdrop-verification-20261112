import { useEffect, useRef } from "react"
import type { UiWallet, UiWalletAccount } from "@wallet-standard/react"
import { usePersistFn } from "@repo/shared/hooks"
import { useSolana } from "../components/solana-provider"
import { useDisconnect } from "./use-disconnect"

export interface EnsureWalletConnectedResult {
  wallet: UiWallet
  account: UiWalletAccount
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
  resolve: (value: EnsureWalletConnectedResult) => void
  reject: (error: Error) => void
}

const GRACE_MS = 300

// The provider holds `selectedWallet` as a snapshot from when it was set.
// When wallet-standard fires a `change` event, useWallets() returns a *new*
// UiWallet object for the same wallet name. The snapshot keeps the old
// reference whose `.accounts` getter can return stale data, even while the
// fresh entry in `wallets` has the current address. Re-resolving from the
// live `wallets` list right before handing the result to the caller avoids
// passing a stale reference into downstream signers.
const resolveFresh = (
  wallets: readonly UiWallet[],
  wallet: UiWallet,
  account: UiWalletAccount,
): EnsureWalletConnectedResult | null => {
  const fresh = wallets.find((w) => w.name === wallet.name) ?? wallet
  const freshAccount = fresh.accounts.find((a) => a.address === account.address) ?? account
  if (!fresh.accounts.some((a) => a.address === freshAccount.address)) {
    return null
  }
  return { wallet: fresh, account: freshAccount }
}

// Opens the Solana connect modal (if needed) and awaits selection in a single
// promise. Replaces the openConnectModal() + useEffect(isConnected) dance
// that frequently required a second click because the 250ms fallback reset
// "pending" before the wallet state caught up.
export const useEnsureWalletConnected = (): UseEnsureWalletConnectedResult => {
  const {
    wallets,
    isConnected,
    selectedAccount,
    selectedWallet,
    isConnectModalOpen,
    openConnectModal,
  } = useSolana()
  const [, disconnect] = useDisconnect(selectedWallet)

  const stateRef = useRef({
    wallets,
    isConnected,
    selectedAccount,
    selectedWallet,
    isConnectModalOpen,
  })
  stateRef.current = {
    wallets,
    isConnected,
    selectedAccount,
    selectedWallet,
    isConnectModalOpen,
  }

  const deferredRef = useRef<Deferred | null>(null)

  // Resolve as soon as we have a usable wallet+account.
  useEffect(() => {
    if (isConnected && selectedWallet && selectedAccount && deferredRef.current) {
      const fresh = resolveFresh(wallets, selectedWallet, selectedAccount)
      if (fresh) {
        deferredRef.current.resolve(fresh)
        deferredRef.current = null
      }
    }
  }, [isConnected, selectedWallet, selectedAccount, wallets])

  // Modal closed without a connection → reject after a short grace window for
  // state to settle. Don't reject while still pre-open (open() flips this true
  // synchronously below; the close transition is what we care about).
  const wasOpenRef = useRef(isConnectModalOpen)
  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isConnectModalOpen
    if (!wasOpen || isConnectModalOpen) return
    const pending = deferredRef.current
    if (!pending) return
    const timer = setTimeout(() => {
      if (deferredRef.current !== pending) return
      const {
        wallets: ws,
        isConnected: c,
        selectedAccount: a,
        selectedWallet: w,
      } = stateRef.current
      const fresh = c && a && w ? resolveFresh(ws, w, a) : null
      deferredRef.current = null
      if (fresh) {
        pending.resolve(fresh)
      } else {
        pending.reject(new Error("Wallet connection cancelled"))
      }
    }, GRACE_MS)
    return () => clearTimeout(timer)
  }, [isConnectModalOpen])

  const ensureWalletConnected = usePersistFn(async (options?: EnsureWalletConnectedOptions) => {
    const forceReconnect = options?.forceReconnect ?? false
    const { wallets: ws, isConnected: c, selectedAccount: a, selectedWallet: w } = stateRef.current

    if (!forceReconnect && c && a && w) {
      const fresh = resolveFresh(ws, w, a)
      if (fresh) return fresh
      // Stored state says connected but the wallet entry no longer has this
      // address (revoked in wallet UI, etc.). Fall through to re-prompt.
    }

    deferredRef.current?.reject(new Error("Wallet connection superseded"))
    deferredRef.current = null

    // Disconnect (clears provider state + localStorage, so autoConnect won't
    // silently restore it) → the modal opens on a clean picker for a fresh
    // wallet/account choice.
    if (forceReconnect && c && w) {
      await disconnect()
    }

    return new Promise<EnsureWalletConnectedResult>((resolve, reject) => {
      deferredRef.current = { resolve, reject }
      openConnectModal()
    })
  })

  return { ensureWalletConnected }
}
