import {
  type Address,
  type Instruction,
  type Rpc,
  type SolanaRpcApi,
  type TransactionSigner,
} from "@solana/kit"
import { ensureAta } from "@repo/chain-solana-kit/token"
import { getComputeBudgetInstructions } from "@repo/chain-solana-kit/transaction"
import { getClaimInstructionAsync } from "../generated/instructions/claim"
import type { Stream, NftBinding } from "./fetch"

/** Context for building clique-lock claim-vested instructions (the second claim). */
export interface BuildClaimLockedContext {
  rpc: Rpc<SolanaRpcApi>
  payer: TransactionSigner
  claimer: Address
  streamId: Uint8Array
  stream: Stream
  streamPda: Address
  tokenProgram: Address
  // For NFT-bound streams
  nftBinding?: NftBinding
  nftBindingPda?: Address
  nftHolderTokenAccount?: Address
}

/** Build instructions for claiming locked tokens from a clique-lock stream. */
export const buildClaimLockedInstructions = async (
  ctx: BuildClaimLockedContext,
): Promise<{ instructions: Instruction[] }> => {
  const {
    rpc,
    payer,
    claimer,
    streamId,
    stream,
    streamPda,
    tokenProgram,
    nftBindingPda,
    nftHolderTokenAccount,
  } = ctx

  const { mint } = stream

  const { ata: recipientAta, instruction: createAtaIx } = await ensureAta({
    rpc,
    owner: claimer,
    mint,
    payer: payer.address,
    tokenProgram,
  })

  const claimInstruction = await getClaimInstructionAsync({
    stream: streamPda,
    recipient: recipientAta,
    mint,
    tokenProgram,
    streamId: Array.from(streamId),
    nftBinding: nftBindingPda,
    nftHolderTokenAccount,
  })

  const instructions: Instruction[] = []
  if (createAtaIx) instructions.push(createAtaIx)
  instructions.push(claimInstruction, ...getComputeBudgetInstructions())

  return { instructions }
}
