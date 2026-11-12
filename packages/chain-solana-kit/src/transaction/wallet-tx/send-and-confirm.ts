import { type ConfirmTransactionContext, type SendTransactionParams } from "./types"
import { confirmTransaction } from "./confirm"
import { sendTransaction } from "./send"

/**
 * Full pipeline: simulate → refresh blockhash → sign → send → confirm.
 * Dispatches internally on wallet kind (standard vs SquadsX multisig).
 * Returns the on-chain transaction signature.
 *
 * Use `sendTransaction` + `confirmTransaction` separately when you need the
 * opaque handle for UX (e.g. showing a "waiting for multisig approval" state).
 */
export const sendAndConfirm = async (
  params: SendTransactionParams,
  ctx?: ConfirmTransactionContext,
): Promise<string> => {
  const handle = await sendTransaction(params)
  return confirmTransaction(
    handle,
    ctx ?? { rpc: params.rpc, rpcSubscriptions: params.rpcSubscriptions },
  )
}
