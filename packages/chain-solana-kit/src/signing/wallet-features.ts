/**
 * True when the wallet advertises the wallet-standard `solana:signMessage`
 * feature. Wallets that don't expose it (Ledger and other hardware wallets)
 * can't produce an off-chain signature and must fall back to the on-chain
 * memo-tx scheme instead — see react/signing/use-sign-message.ts.
 *
 * (Tx-kind detection — `isSquadsXWallet` / `isMultisigWallet` — lives with the
 * tx strategies in `transaction/wallet-tx/detect.ts`; this predicate is a
 * message-SIGNING capability, a distinct concern.)
 */
export const walletSupportsSignMessage = (
  wallet?: { features: readonly string[] } | null,
): boolean => wallet?.features.includes("solana:signMessage") ?? false
