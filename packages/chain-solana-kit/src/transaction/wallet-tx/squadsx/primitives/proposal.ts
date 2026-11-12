import {
  type Rpc,
  type SolanaRpcApi,
  type Signature,
  type Address,
  getSignatureFromTransaction,
  sendTransactionWithoutConfirmingFactory,
} from "@solana/kit"
import { accounts, getProposalPda } from "@sqds/multisig"
import { PublicKey } from "@solana/web3.js"
import { Buffer } from "buffer"
import { formatError } from "../../../../errors"
import { type SendableTransaction } from "../../../types"

/**
 * Squads V4 proposal-PDA resolution. Split out of the former
 * `squadsx/execution.ts`; parallels the EVM kit's `safe/*` module family.
 *
 * Resolves the on-chain proposal PDA from a proposal-creation transaction:
 * extract the multisig PDA from the Squads instruction, read the multisig
 * account for its current transaction index, then derive the proposal PDA.
 */

/** Squads V4 Program ID */
export const SQUADS_V4_PROGRAM_ID = "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf" as Address

/**
 * Derives the proposal PDA from a proposal creation transaction.
 * Extracts the multisig PDA from the Squads instruction, fetches the
 * multisig account for the current transaction index, then derives the PDA.
 */
export const resolveProposalAddress = async (
  rpc: Rpc<SolanaRpcApi>,
  proposalSignature: string,
): Promise<Address> => {
  const tx = await rpc
    .getTransaction(proposalSignature as Signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
      encoding: "json",
    })
    .send()

  if (!tx?.transaction || !("message" in tx.transaction)) {
    throw new Error("Failed to fetch proposal creation transaction")
  }

  const { message } = tx.transaction
  const accountKeys = message.accountKeys as readonly Address[]
  const instructions = message.instructions as unknown as readonly {
    programIdIndex: number
    accounts?: number[]
    data: string
  }[]

  // 1. Extract the multisig PDA from the Squads instruction (first account)
  let multisigPda: Address | undefined
  for (const instruction of instructions) {
    if (accountKeys[instruction.programIdIndex] !== SQUADS_V4_PROGRAM_ID) continue

    const accountIndices = instruction.accounts ?? []
    if (accountIndices[0] !== undefined) {
      multisigPda = accountKeys[accountIndices[0]]
      break
    }
  }

  if (!multisigPda) {
    throw new Error("Could not identify multisig PDA from transaction")
  }

  // 2. Fetch multisig account for the current transaction index
  const multisigAccountInfo = await rpc.getAccountInfo(multisigPda, { encoding: "base64" }).send()

  if (!multisigAccountInfo?.value) {
    throw new Error("Multisig account not found")
  }

  const [multisig] = accounts.Multisig.deserialize(
    Buffer.from(multisigAccountInfo.value.data[0], "base64"),
  )
  const transactionIndex = BigInt(multisig.transactionIndex.toString())

  // 3. Derive the proposal PDA from the current transaction index
  const [proposalPda] = getProposalPda({
    multisigPda: new PublicKey(multisigPda),
    transactionIndex,
  })

  return proposalPda.toBase58() as Address
}

/**
 * Submits a signed SquadsX proposal-creation transaction and returns its
 * signature. The single submit primitive shared by the handle-level `send`
 * (`../send.ts`) and the commit-reveal message-signing path
 * (`signing/commit-reveal/squads.ts`) — both formerly inlined this sequence.
 *
 * `skipPreflight` because a SquadsX proposal tx only *creates* the proposal;
 * it does not execute the wrapped instruction, so preflight simulation of the
 * inner tx would spuriously fail. Confirmed at `commitment: 'confirmed'`.
 */
export const sendProposal = async (
  rpc: Rpc<SolanaRpcApi>,
  signed: SendableTransaction,
): Promise<string> => {
  const proposalSignature = getSignatureFromTransaction(signed)

  const send = sendTransactionWithoutConfirmingFactory({ rpc })
  try {
    await send(signed, { skipPreflight: true, commitment: "confirmed" })
  } catch (e) {
    throw new Error(`Failed to submit SquadsX proposal: ${formatError(e)}`, { cause: e })
  }

  return proposalSignature as string
}
