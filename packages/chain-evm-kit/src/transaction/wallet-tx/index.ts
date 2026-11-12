// Wallet-aware transaction namespace — high-level walletTx object + primitives.
// Re-exported via ../index.ts so `../transaction` remains the stable import point.

import { sendTransaction } from "./send"
import { confirmTransaction } from "./confirm"
import { sendAndConfirm } from "./send-and-confirm"

/**
 * Wallet-aware, handle-based high-level transaction API.
 *
 * - `walletTx.send`           — detect wallet kind, broadcast, return handle
 * - `walletTx.confirm`        — resolve handle → receipt (Safe-aware)
 * - `walletTx.sendAndConfirm` — full pipeline in one call
 *
 * Named `walletTx` to distinguish from the viem primitive `sendTransaction`
 * and the low-level `waitForTransactionReceipt`.
 */
export const walletTx = {
  send: sendTransaction,
  confirm: confirmTransaction,
  sendAndConfirm,
}

// Primitives re-exported for ../utils surface (parallel to the Solana kit:
// walletTx + confirmTransaction + detect{Chain}WalletKind + the multisig-exec wait).
export { confirmTransaction } from "./confirm"
export { detectEvmWalletKind } from "./detect"
export { waitForSafeExecutionByEvent } from "./safe"
export type { EvmWalletKind, EvmTxHandle, EvmConfirmContext, SafeExecutionResult } from "./types"
