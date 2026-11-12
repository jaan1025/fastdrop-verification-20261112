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
} from "@solana/kit"
import { getAddMemoInstruction } from "@solana-program/memo"
import type { Hex } from "viem"
import { signMessageWithCommitReveal } from "./scheme"
import { sendProposal } from "../../transaction/wallet-tx/squadsx/primitives/proposal"
import { waitForExecution } from "../../transaction/wallet-tx/squadsx/primitives/execution"
import type { SendableTransaction } from "../../transaction/types"

export interface SignMessageWithSquadsXParams {
  rpc: Rpc<SolanaRpcApi>
  signer: TransactionSigner
  message: string
}

/**
 * Sign a message using the commit-reveal scheme via SquadsX multisig transport:
 *  1. Build a memo transaction carrying the commitment.
 *  2. Sign it (the SquadsX wallet adapter intercepts and wraps it as a proposal).
 *  3. Submit via `sendProposal` (sends the proposal-creation tx), then
 *     `waitForExecution` polls the on-chain proposal status until the multisig
 *     executes it. (No generic finality `confirm` here — the execution tx
 *     signature is used directly.)
 *  4. Use the execution tx signature as the `T` component of the commit-reveal
 *     signature.
 */
export const signMessageWithSquadsX = async (
  params: SignMessageWithSquadsXParams,
): Promise<string> => {
  const { rpc, signer, message } = params

  return signMessageWithCommitReveal({
    message,
    sendMemoTx: async (commitment: Hex) => {
      const { value: blockhash } = await rpc.getLatestBlockhash().send()

      const memoMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayerSigner(signer, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
        (m) =>
          appendTransactionMessageInstruction(
            getAddMemoInstruction({ memo: commitment, signers: [signer] }),
            m,
          ),
      )

      const signed = (await signTransactionMessageWithSigners(memoMessage)) as SendableTransaction

      const proposalSignature = await sendProposal(rpc, signed)
      return waitForExecution({ rpc, proposalSignature })
    },
  })
}
