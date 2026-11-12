"use client"

import { useCallback } from "react"
import bs58 from "bs58"
import { useSolana } from "../components/solana-provider"
import { useSolanaReadClients } from "../clients"
import { isSquadsXWallet } from "../../transaction/wallet-tx/squadsx"
import { logger } from "../../utils/logger"
import { useWalletSigners } from "../components/safe-wallet-signers"
import { signMessageWithMemoTx } from "../../signing/memo-tx"
import { signMessageWithSquadsX } from "../../signing/commit-reveal/squads"
import { isUserRejection } from "../../signing/is-user-rejection"

/**
 * Sign-message hook with wallet-specific strategy dispatch.
 *
 * Safe to call in any connection state — the signer is resolved at call time,
 * and `signMessage` rejects with `"Wallet is not connected"` while disconnected.
 *
 * The strategy is chosen from the wallet's own capabilities — no caller flag.
 * Order matters: SquadsX is matched by name BEFORE the feature check, since a
 * multisig also lacks `solana:signMessage` but needs commit-reveal, not memo-tx.
 *
 *  - SquadsX (by name)               → commit-reveal via multisig proposal
 *                                      (returns hex-encoded 100-byte signature)
 *  - no `solana:signMessage` feature → memo-tx fallback (proactive — a bare
 *                                      Ledger connected directly via wallet-standard)
 *                                      (returns base64-encoded wire transaction)
 *  - otherwise                       → wallet-standard `solana:signMessage`,
 *                                      with a REACTIVE memo-tx fallback (returns
 *                                      base58 on success / base64 after fallback)
 *
 * Reactive fallback: a software wallet (Phantom, Solflare, Backpack…) advertises
 * `solana:signMessage` even when the *active account is a Ledger*, which then
 * rejects the off-chain sign at runtime. This is undetectable before signing —
 * wallet-standard exposes no per-account "is hardware" flag — so we try the raw
 * sign and, on any non-user-rejection failure, fall back to the memo-tx scheme.
 * Fallbacks are reported through the injected `logger` seam (no `console.*`).
 *
 * The returned string is opaque to callers and is parsed by the backend using
 * the encoding prefix.
 */
export const useSignMessage = () => {
  // The wallet's cluster drives the memo-tx fallback rpc (a rare hardware-wallet
  // path); the off-chain sign paths don't need rpc. Resolved from the global
  // registry by the wallet's chain.
  const { chain, selectedWallet } = useSolana()
  const { rpc } = useSolanaReadClients(chain)
  const { getSignMessage, getTransactionSigner } = useWalletSigners()

  const signMessage = useCallback(
    async (params: { message: string }) => {
      const { message } = params
      // Getters read the live signers at call time — fresh after a mid-flow
      // connect, no render-captured staleness.
      const signMessageFn = getSignMessage()
      const transactionSigner = getTransactionSigner()
      // Only the transaction signer is required for connectivity — every listed
      // wallet exposes `solana:signTransaction`. `signMessageFn` is bound only
      // when the account exposes `solana:signMessage`, so its absence is a
      // capability signal (handled below), NOT a "not connected" condition.
      if (!selectedWallet || !transactionSigner) {
        throw new Error("Wallet is not connected")
      }

      if (isSquadsXWallet(selectedWallet)) {
        if (!rpc) throw new Error("Solana rpc not ready")
        return signMessageWithSquadsX({
          rpc,
          signer: transactionSigner,
          message,
        })
      }

      // Proactive: the account doesn't expose `solana:signMessage` (no raw
      // signer bound — a bare Ledger or other hardware wallet) — skip the
      // doomed attempt and go straight to memo-tx.
      if (!signMessageFn) {
        logger.warn(
          "[solana:signMessage] account does not expose the `solana:signMessage` feature — falling back to the on-chain memo-tx signing scheme (hardware-wallet path).",
          { wallet: selectedWallet.name },
        )
        if (!rpc) throw new Error("Solana rpc not ready")
        return signMessageWithMemoTx({
          rpc,
          signer: transactionSigner,
          message,
        })
      }

      // Reactive: the feature is advertised, but the active account may be
      // hardware-backed (e.g. Phantom holding a Ledger account) and reject the
      // off-chain sign at runtime. Try the raw path; on any non-user-rejection
      // failure, fall back to memo-tx.
      try {
        const { signature } = await signMessageFn({
          message: new TextEncoder().encode(message),
        })
        return bs58.encode(signature)
      } catch (error) {
        if (isUserRejection(error)) throw error
        logger.warn(
          "[solana:signMessage] off-chain message signing failed — likely a hardware wallet behind a software wallet (e.g. Ledger via Phantom). Falling back to the on-chain memo-tx signing scheme.",
          { wallet: selectedWallet.name, error },
        )
        if (!rpc) throw new Error("Solana rpc not ready")
        return signMessageWithMemoTx({
          rpc,
          signer: transactionSigner,
          message,
        })
      }
    },
    [rpc, selectedWallet, getSignMessage, getTransactionSigner],
  )

  return { signMessage }
}
