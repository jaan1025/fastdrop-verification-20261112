import {
  assertIsSendableTransaction,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit"
import { assertNever } from "@repo/shared/utils"
import { logger } from "../../utils/logger"
import { simulate } from "../simulate"
import { type SendableTransaction } from "../types"
import { type SolanaTxHandle, type SendTransactionParams } from "./types"
import { detectSolanaWalletKind } from "./detect"
import { standardSend } from "./standard"
import { squadsxSend } from "./squadsx"

/**
 * Simulate → refresh blockhash → sign → send, dispatching on wallet kind.
 *
 * Returns an opaque `SolanaTxHandle` that carries whatever the subsequent
 * `confirmTransaction` call needs:
 *   - `{kind:'standard', signature}` — for ordinary wallets.
 *   - `{kind:'squadsx', proposalSignature}` — for SquadsX multisig; the
 *     proposal creation tx signature is the key for polling execution.
 *
 * No confirmation / multisig-execution wait happens here.
 *
 * The simulate → sign prelude is shared by every wallet kind; only the final
 * send differs, so it is delegated to a per-kind strategy (parallel to the EVM
 * kit's `eoaSend` / `safeSend`). Exhaustive: adding a new `SolanaWalletKind` is
 * a compile error here.
 *
 * The blockhash refresh happens *after* simulation deliberately:
 * `simulate` uses `replaceRecentBlockhash: true` so the caller's blockhash is
 * ignored, and refreshing afterwards gives the signed transaction the freshest
 * possible blockhash for its ~60 s validity window — important for slow
 * signers (Ledger, SquadsX).
 */
export const sendTransaction = async (params: SendTransactionParams): Promise<SolanaTxHandle> => {
  const { rpc, wallet } = params
  let { txMessage } = params

  // 1. Simulate. `replaceRecentBlockhash: true` inside `simulate` means the
  //    caller's blockhash on `txMessage` is ignored — only its shape matters.
  const simulation = await simulate(rpc, txMessage, params.resolveProgramError)
  if (!simulation.success) {
    logger.error("[tx] simulation failed", {
      error: simulation.error,
      errorMessage: simulation.errorMessage,
      logs: simulation.logs,
    })
    throw new Error(`Transaction simulation failed: ${simulation.errorMessage}`)
  }
  logger.warn("[tx] simulation succeeded", {
    unitsConsumed: simulation.unitsConsumed?.toString(),
  })

  // 2. Refresh blockhash for maximum freshness at send time.
  const { value: freshBlockhash } = await rpc.getLatestBlockhash().send()
  txMessage = setTransactionMessageLifetimeUsingBlockhash(freshBlockhash, txMessage)

  // 3. Sign.
  const signed = (await signTransactionMessageWithSigners(txMessage)) as SendableTransaction
  assertIsSendableTransaction(signed)

  // 4. Send — dispatch by wallet kind. No confirm/wait here.
  const kind = detectSolanaWalletKind(wallet)
  switch (kind) {
    case "standard":
      return standardSend(rpc, signed)
    case "squadsx":
      return squadsxSend(rpc, signed)
    default:
      return assertNever(kind)
  }
}
