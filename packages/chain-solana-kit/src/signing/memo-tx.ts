import {
  type Rpc,
  type SolanaRpcApi,
  type TransactionSigner,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
} from "@solana/kit"
import { getAddMemoInstruction } from "@solana-program/memo"

export interface SignMessageWithMemoTxParams {
  rpc: Rpc<SolanaRpcApi>
  signer: TransactionSigner
  message: string
}

/**
 * Sign a message by embedding it as a Memo instruction in a transaction.
 * Used for wallets that don't expose `solana:signMessage` (e.g. hardware
 * wallets via Ledger). Only signs — does not send or confirm on-chain.
 *
 * Returns the base64-encoded signed transaction for backend verification.
 */
export const signMessageWithMemoTx = async (
  params: SignMessageWithMemoTxParams,
): Promise<string> => {
  const { rpc, signer, message } = params

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(signer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstruction(getAddMemoInstruction({ memo: message }), m),
  )

  const signedTransaction = await signTransactionMessageWithSigners(transactionMessage)

  return getBase64EncodedWireTransaction(signedTransaction)
}
