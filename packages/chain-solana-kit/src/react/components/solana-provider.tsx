import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { type UiWallet, type UiWalletAccount, useWallets } from "@wallet-standard/react"
import { StandardConnect } from "@wallet-standard/core"
import type { StandardConnectFeature } from "@wallet-standard/features"
import { getWalletFeature } from "@wallet-standard/ui"
import { SolanaConnectModal } from "./solana-connect-modal"
import { SafeWalletSignersProvider } from "./safe-wallet-signers"
import { resolveChain, type SolanaChain, type SolanaCluster } from "../../config/network"

export interface SolanaProviderConfig {
  /** The wallet's cluster — drives the `chain` tag used for signing. */
  network?: SolanaCluster
  /**
   * Endpoint fields — NO LONGER consumed by the wallet provider (per-read rpc/ws
   * now live in the global `SolanaClientsProvider`, keyed by chainId). Kept on the
   * type only because `deploymentToSolanaConfig` reuses this shape to seed the
   * registry; the wallet provider ignores them.
   */
  rpcUrl?: string
  wsUrl?: string
}

interface SolanaContextValue {
  /** The wallet's cluster tag (for signing context). Per-read rpc/ws live in the registry. */
  chain: SolanaChain
  wallets: UiWallet[]
  selectedWallet: UiWallet | null
  selectedAccount: UiWalletAccount | null
  isConnected: boolean
  isConnectModalOpen: boolean
  setWalletAndAccount: (wallet: UiWallet | null, account: UiWalletAccount | null) => void
  openConnectModal: () => void
  closeConnectModal: () => void
}

const SolanaContext = createContext<SolanaContextValue | undefined>(undefined)

export const useSolana = (): SolanaContextValue => {
  const context = useContext(SolanaContext)
  if (!context) {
    throw new Error("useSolana must be used within SolanaProvider")
  }
  return context
}

interface SolanaProviderProps {
  children: ReactNode
  config?: SolanaProviderConfig
  autoConnect?: boolean
}

const WALLET_STORAGE_KEY = "clique:solana:wallet-name"

export const SolanaProvider = ({
  children,
  config = {},
  autoConnect = true,
}: SolanaProviderProps) => {
  const [open, setOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<UiWallet | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<UiWalletAccount | null>(null)
  const autoConnecting = useRef(false)

  const cluster = (config.network ?? "mainnet-beta") as SolanaCluster
  const chain = useMemo(() => resolveChain(cluster), [cluster])

  const allWallets = useWallets()
  const wallets = useMemo(
    () =>
      allWallets.filter(
        (wallet) =>
          wallet.chains?.some((c) => c.startsWith("solana:")) &&
          wallet.features.includes(StandardConnect) &&
          wallet.features.includes("solana:signTransaction"),
      ),
    [allWallets],
  )

  const setWalletAndAccount = useCallback(
    (wallet: UiWallet | null, account: UiWalletAccount | null) => {
      setSelectedWallet(wallet)
      setSelectedAccount(account)
      try {
        if (wallet) {
          localStorage.setItem(WALLET_STORAGE_KEY, wallet.name)
        } else {
          localStorage.removeItem(WALLET_STORAGE_KEY)
        }
      } catch {
        // localStorage unavailable (SSR, private browsing)
      }
    },
    [],
  )

  useEffect(() => {
    if (!autoConnect || selectedWallet || autoConnecting.current) return

    let savedName: string | null = null
    try {
      savedName = localStorage.getItem(WALLET_STORAGE_KEY)
    } catch {
      return
    }
    if (!savedName) return

    const wallet = wallets.find((w) => w.name === savedName)
    if (!wallet) return

    const existingAccount = wallet.accounts[0]
    if (existingAccount) {
      setSelectedWallet(wallet)
      setSelectedAccount(existingAccount)
      return
    }

    autoConnecting.current = true
    const connectFeature = getWalletFeature(
      wallet,
      StandardConnect,
    ) as StandardConnectFeature[typeof StandardConnect]

    connectFeature
      .connect({ silent: true })
      .then(() => {
        const account = wallet.accounts[0]
        if (account) {
          setSelectedWallet(wallet)
          setSelectedAccount(account)
        }
      })
      .catch(() => {
        try {
          localStorage.removeItem(WALLET_STORAGE_KEY)
        } catch {
          // ignore
        }
      })
      .finally(() => {
        autoConnecting.current = false
      })
  }, [autoConnect, wallets, selectedWallet])

  const isConnected = useMemo(() => {
    if (!selectedAccount || !selectedWallet) return false
    const currentWallet = wallets.find((w) => w.name === selectedWallet.name)
    return Boolean(
      currentWallet?.accounts.some((account) => account.address === selectedAccount.address),
    )
  }, [selectedAccount, selectedWallet, wallets])

  const openConnectModal = useCallback(() => setOpen(true), [])
  const closeConnectModal = useCallback(() => setOpen(false), [])

  const contextValue = useMemo<SolanaContextValue>(
    () => ({
      chain,
      wallets,
      selectedWallet,
      selectedAccount,
      isConnected,
      isConnectModalOpen: open,
      setWalletAndAccount,
      openConnectModal,
      closeConnectModal,
    }),
    [
      chain,
      wallets,
      selectedWallet,
      selectedAccount,
      isConnected,
      open,
      setWalletAndAccount,
      openConnectModal,
      closeConnectModal,
    ],
  )

  return (
    <SolanaContext.Provider value={contextValue}>
      <SafeWalletSignersProvider>{children}</SafeWalletSignersProvider>
      <SolanaConnectModal open={open} onOpenChange={setOpen} />
    </SolanaContext.Provider>
  )
}
