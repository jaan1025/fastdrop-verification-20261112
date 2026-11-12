import { type Rpc, type SolanaRpcApi } from "@solana/kit"
import { type SendableTransaction } from "../../types"
import { type SolanaTxHandle } from "../types"
import { sendProposal } from "./primitives/proposal"

/**
 * SquadsX `send`: create the Squads proposal; `proposalSignature` is the
 * proposal-creation tx signature (NOT yet executed). Thin adapter over the
 * shared `sendProposal` submit primitive. Parallel to the EVM kit's
 * `safe/send.ts`.
 */
export const squadsxSend = async (
  rpc: Rpc<SolanaRpcApi>,
  signed: SendableTransaction,
): Promise<SolanaTxHandle & { kind: "squadsx" }> => {
  const proposalSignature = await sendProposal(rpc, signed)
  return { kind: "squadsx", proposalSignature }
}
