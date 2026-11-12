import { createPdaFinder, type PdaResult } from "@repo/chain-solana-kit/utils"
import { CLIQUE_LOCK_PROGRAM_ADDRESS } from "../generated/programs/cliqueLock"

const findPda = createPdaFinder(CLIQUE_LOCK_PROGRAM_ADDRESS)

export const getStreamPDA = async (streamId: Uint8Array): Promise<PdaResult> =>
  findPda(["Stream", streamId])

export const getNftBindingPDA = async (streamId: Uint8Array): Promise<PdaResult> =>
  findPda(["NftBinding", streamId])

// The on-chain `StreamId` counter account + its `initialize` instruction are
// VESTIGIAL: streams are addressed by the deterministic
// `keccak256(distributor‖root‖recipient)` (see distributor/strategies/
// lock/stream-id), passed as a parameter — not by a monotonic counter. This PDA
// finder is retained only for completeness against the generated program surface.
export const getStreamIdPDA = async (): Promise<PdaResult> => findPda(["StreamId"])
