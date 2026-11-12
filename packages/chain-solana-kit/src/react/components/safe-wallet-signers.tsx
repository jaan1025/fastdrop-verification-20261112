"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react"
import {
  useSignMessage,
  useSignTransaction,
  useWalletAccountMessageSigner,
  useWalletAccountTransactionSigner,
} from "@solana/react"
import type { MessageModifyingSigner, TransactionModifyingSigner } from "@solana/kit"
import type { UiWalletAccount } from "@wallet-standard/react"
import { useSolana } from "./solana-provider"
import type { SolanaChain } from "../../config/network"

type SignMessageFn = ReturnType<typeof useSignMessage>
type SignTransactionFn = ReturnType<typeof useSignTransaction>

/** Wallet-standard feature ids each binder is scoped to. */
const SIGN_TRANSACTION_FEATURE = "solana:signTransaction"
const SIGN_MESSAGE_FEATURE = "solana:signMessage"

/** Transaction-signing slice — bound whenever `solana:signTransaction` is present. */
interface TransactionSigners {
  signTransaction: SignTransactionFn
  transactionSigner: TransactionModifyingSigner
}

/** Message-signing slice — bound only when `solana:signMessage` is present. */
interface MessageSigners {
  signMessage: SignMessageFn
  messageSigner: MessageModifyingSigner
}

/** The connected wallet's full signing surface (the `@solana/react` set). */
export interface WalletSigners {
  /**
   * Raw wallet-standard message-sign callback (base58 sig path). Null when the
   * account doesn't expose `solana:signMessage` (SquadsX multisig, hardware
   * wallets) — the sign dispatch routes around it (commit-reveal / memo-tx).
   */
  signMessage: SignMessageFn | null
  /** Raw wallet-standard transaction-sign callback. */
  signTransaction: SignTransactionFn
  /** Kit message signer. Null when the account doesn't expose `solana:signMessage`. */
  messageSigner: MessageModifyingSigner | null
  /** Kit transaction signer (fee-payer of every claim/transfer tx). */
  transactionSigner: TransactionModifyingSigner
}

export type GetTransactionSigner = () => TransactionModifyingSigner | null
export type GetSignMessage = () => SignMessageFn | null

/**
 * What `useWalletSigners()` returns:
 *  - the render-captured signer values (null while disconnected) — for the
 *    common case where the signer isn't needed in the same handler that just
 *    connected the wallet;
 *  - two call-time getters that read the LIVE signer when invoked — for the
 *    connect-then-sign spots (login, ToS) where a render-captured value would
 *    be stale right after a mid-flow connect.
 */
export interface UseWalletSignersResult {
  signMessage: SignMessageFn | null
  signTransaction: SignTransactionFn | null
  messageSigner: MessageModifyingSigner | null
  transactionSigner: TransactionModifyingSigner | null
  getTransactionSigner: GetTransactionSigner
  getSignMessage: GetSignMessage
}

interface SafeWalletSignersContextValue {
  snapshot: WalletSigners | null
  getTransactionSigner: GetTransactionSigner
  getSignMessage: GetSignMessage
}

const SafeWalletSignersContext = createContext<SafeWalletSignersContextValue | null>(null)

/**
 * Provides the connected wallet's signers both as reactive values and as
 * call-time getters.
 *
 * The signing surface is bound by two independent, feature-scoped binders mounted
 * per the connected account's `features`:
 *  - `TransactionSignerBinder` (every wallet — `solana:signTransaction`)
 *  - `MessageSignerBinder` (only accounts exposing `solana:signMessage`)
 *
 * This split matters because `@solana/react`'s `useSignMessage` /
 * `useWalletAccountMessageSigner` THROW for accounts that lack the feature
 * (SquadsX multisig, hardware wallets). Gating the message binder on the feature
 * keeps those hooks from ever running for such accounts; their message slice
 * stays null and the sign dispatch routes through the transaction-based schemes
 * (commit-reveal / memo-tx).
 *
 * Each binder publishes its slice two ways: into a ref DURING RENDER (so the
 * getters are fresh the instant the binder renders — before any effect, incl.
 * preflight's resolve, runs) and into state via an effect (reactive values). The
 * provider merges the two slices into the public `WalletSigners` snapshot.
 */
export const SafeWalletSignersProvider = ({ children }: { children: ReactNode }) => {
  const { selectedAccount, isConnected, chain } = useSolana()

  const [txSigners, setTxSigners] = useState<TransactionSigners | null>(null)
  const [msgSigners, setMsgSigners] = useState<MessageSigners | null>(null)
  const txRef = useRef<TransactionSigners | null>(null)
  const msgRef = useRef<MessageSigners | null>(null)

  // Stable getters over the refs — identity never changes.
  const getters = useMemo(
    () => ({
      getTransactionSigner: () => txRef.current?.transactionSigner ?? null,
      getSignMessage: () => msgRef.current?.signMessage ?? null,
    }),
    [],
  )

  // Merge the two slices. The snapshot is null until the transaction slice is
  // bound (i.e. until connected); the message slice may stay null for accounts
  // that don't expose `solana:signMessage`.
  const snapshot = useMemo<WalletSigners | null>(
    () =>
      txSigners
        ? {
            signTransaction: txSigners.signTransaction,
            transactionSigner: txSigners.transactionSigner,
            signMessage: msgSigners?.signMessage ?? null,
            messageSigner: msgSigners?.messageSigner ?? null,
          }
        : null,
    [txSigners, msgSigners],
  )

  const value = useMemo<SafeWalletSignersContextValue>(
    () => ({ snapshot, ...getters }),
    [snapshot, getters],
  )

  const features = selectedAccount?.features ?? []

  return (
    <>
      {selectedAccount && isConnected && (
        <>
          {features.includes(SIGN_TRANSACTION_FEATURE) && (
            <TransactionSignerBinder
              account={selectedAccount}
              chain={chain}
              signerRef={txRef}
              setSigners={setTxSigners}
            />
          )}
          {features.includes(SIGN_MESSAGE_FEATURE) && (
            <MessageSignerBinder
              account={selectedAccount}
              signerRef={msgRef}
              setSigners={setMsgSigners}
            />
          )}
        </>
      )}
      <SafeWalletSignersContext.Provider value={value}>
        {children}
      </SafeWalletSignersContext.Provider>
    </>
  )
}

/**
 * Publishes a signer slice two ways: into the ref DURING RENDER (fresh getters)
 * and into state via an effect (reactive values). Cleared on unmount — i.e. on
 * disconnect, account switch, or loss of the slice's feature.
 */
const usePublishSigners = <T,>(
  signers: T,
  signerRef: RefObject<T | null>,
  setSigners: (signers: T | null) => void,
) => {
  // Fresh for getters, before any effect runs.
  signerRef.current = signers

  // Reactive for the value path.
  useEffect(() => {
    setSigners(signers)
  }, [signers, setSigners])

  // Clear on unmount.
  useEffect(
    () => () => {
      signerRef.current = null
      setSigners(null)
    },
    [signerRef, setSigners],
  )
}

/**
 * Binds the transaction-signing slice. Mounted for every connected account —
 * the provider only lists wallets exposing `solana:signTransaction`.
 */
const TransactionSignerBinder = ({
  account,
  chain,
  signerRef,
  setSigners,
}: {
  account: UiWalletAccount
  chain: SolanaChain
  signerRef: RefObject<TransactionSigners | null>
  setSigners: (signers: TransactionSigners | null) => void
}) => {
  const signTransaction = useSignTransaction(account, chain)
  const transactionSigner = useWalletAccountTransactionSigner(account, chain)

  const signers = useMemo<TransactionSigners>(
    () => ({ signTransaction, transactionSigner }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account.address, chain],
  )

  usePublishSigners(signers, signerRef, setSigners)
  return null
}

/**
 * Binds the message-signing slice. Mounted ONLY for accounts exposing
 * `solana:signMessage` — `@solana/react`'s message-signer hooks throw otherwise.
 */
const MessageSignerBinder = ({
  account,
  signerRef,
  setSigners,
}: {
  account: UiWalletAccount
  signerRef: RefObject<MessageSigners | null>
  setSigners: (signers: MessageSigners | null) => void
}) => {
  const signMessage = useSignMessage(account)
  const messageSigner = useWalletAccountMessageSigner(account)

  const signers = useMemo<MessageSigners>(
    () => ({ signMessage, messageSigner }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account.address],
  )

  usePublishSigners(signers, signerRef, setSigners)
  return null
}

/**
 * Connected wallet's signers — render-captured values plus call-time getters.
 * Use the values for ordinary signing; use `getTransactionSigner` /
 * `getSignMessage` where signing happens in the same handler that just
 * connected the wallet (login, ToS), so the signer is read fresh.
 */
export const useWalletSigners = (): UseWalletSignersResult => {
  const ctx = useContext(SafeWalletSignersContext)
  // Missing provider is a wiring error — fail loud (like `useSolana`), rather
  // than handing back no-op getters that silently mask it. A *disconnected*
  // wallet is the legitimate state, surfaced as null values / null getter
  // returns below, which callers already check.
  if (!ctx) {
    throw new Error("useWalletSigners must be used within SafeWalletSignersProvider")
  }
  const { snapshot } = ctx
  return {
    signMessage: snapshot?.signMessage ?? null,
    signTransaction: snapshot?.signTransaction ?? null,
    messageSigner: snapshot?.messageSigner ?? null,
    transactionSigner: snapshot?.transactionSigner ?? null,
    getTransactionSigner: ctx.getTransactionSigner,
    getSignMessage: ctx.getSignMessage,
  }
}
