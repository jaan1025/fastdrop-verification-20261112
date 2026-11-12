import {
  appendTransactionMessageInstructions,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  type Address,
  type Rpc,
  type SolanaRpcApi,
  type TransactionSigner,
  type Signature,
  sendTransactionWithoutConfirmingFactory,
} from "@solana/kit"
import { getTransferSolInstruction } from "@solana-program/system"
import { type SendableTransaction } from "../transaction/types"

export const transferSol = async (params: {
  rpc: Rpc<SolanaRpcApi>
  signer: TransactionSigner
  destination: Address
  amount: bigint
}): Promise<Signature> => {
  const { rpc, signer, destination, amount } = params

  // 1. Fetch latest blockhash
  const latestBlockhash = (await rpc.getLatestBlockhash().send()).value

  // 2. Build instructions
  const transferInstruction = getTransferSolInstruction({
    source: signer,
    destination,
    amount,
  })

  // 3. Build message
  const message = appendTransactionMessageInstructions(
    [transferInstruction],
    setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      setTransactionMessageFeePayerSigner(signer, createTransactionMessage({ version: 0 })),
    ),
  )

  // 4. Sign
  const signed = (await signTransactionMessageWithSigners(message)) as SendableTransaction

  // 5. Send
  const sendTransaction = sendTransactionWithoutConfirmingFactory({ rpc })
  await sendTransaction(signed, { commitment: "confirmed" })

  return getSignatureFromTransaction(signed)
}
