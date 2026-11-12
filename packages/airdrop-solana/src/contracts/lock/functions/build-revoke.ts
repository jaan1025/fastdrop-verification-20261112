import {
  type Address,
  type Instruction,
  type Rpc,
  type SolanaRpcApi,
  type TransactionSigner,
} from "@solana/kit"
import { ensureAta } from "@repo/chain-solana-kit/token"
import { getComputeBudgetInstructions } from "@repo/chain-solana-kit/transaction"
import { getRevokeInstructionAsync } from "../generated/instructions/revoke"
import type { Stream } from "./fetch"

/** Context for building clique-lock revoke-stream instructions. */
export interface BuildRevokeStreamContext {
  rpc: Rpc<SolanaRpcApi>
  revokeAuthority: TransactionSigner
  streamId: Uint8Array
  stream: Stream
  streamPda: Address
  tokenProgram: Address
  /** Set when the stream is NFT-bound — closes the binding and returns rent. */
  nftBindingPda?: Address
}

/**
 * Build instructions for revoking a clique-lock stream. The unclaimed portion
 * returns to `revokeAuthority`'s token account; rent on the stream and (when
 * NFT-bound) the binding account is returned to the authority.
 */
export const buildRevokeStreamInstructions = async (
  ctx: BuildRevokeStreamContext,
): Promise<{ instructions: Instruction[] }> => {
  const { rpc, revokeAuthority, streamId, stream, streamPda, tokenProgram, nftBindingPda } = ctx

  const { mint } = stream

  // Ensure the revoke authority has an ATA to receive the unclaimed tokens.
  const { ata: authorityAta, instruction: createAtaIx } = await ensureAta({
    rpc,
    owner: revokeAuthority.address,
    mint,
    payer: revokeAuthority.address,
    tokenProgram,
  })

  const revokeIx = await getRevokeInstructionAsync({
    stream: streamPda,
    revokeAuthority,
    mint,
    streamTokenAccount: undefined,
    revokeAuthorityTokenAccount: authorityAta,
    tokenProgram,
    nftBinding: nftBindingPda,
    streamId: Array.from(streamId),
  })

  const instructions: Instruction[] = []
  if (createAtaIx) instructions.push(createAtaIx)
  instructions.push(revokeIx, ...getComputeBudgetInstructions())

  return { instructions }
}
