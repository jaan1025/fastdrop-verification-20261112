// Wallet-aware transaction namespace — high-level walletTx object + types.
// Re-exported via ../index.ts so `../transaction` remains the stable import point.

import { sendTransaction } from "./send"
import { confirmTransaction } from "./confirm"
import { sendAndConfirm } from "./send-and-confirm"

/**
 * Wallet-aware, handle-based high-level transaction API.
 *
 * - `walletTx.send`           — simulate → sign → broadcast, return handle
 * - `walletTx.confirm`        — resolve handle → signature (SquadsX-aware)
 * - `walletTx.sendAndConfirm` — full pipeline in one call
 *
 * Named `walletTx` to distinguish from the Solana kit low-level `confirm`
 * primitive (which operates directly on a signature, not a handle).
 */
export const walletTx = {
  send: sendTransaction,
  confirm: confirmTransaction,
  sendAndConfirm,
}

// Primitives re-exported for ../utils surface (parallel to the EVM kit:
// walletTx + confirmTransaction + detect{Chain}WalletKind + the multisig-exec wait).
export { confirmTransaction } from "./confirm"
export { detectSolanaWalletKind } from "./detect"
export { waitForMultisigExecution } from "./squadsx"
export {
  type ConfirmTransactionContext,
  type SendTransactionParams,
  type SolanaWalletKind,
  type SolanaTxHandle,
} from "./types"
