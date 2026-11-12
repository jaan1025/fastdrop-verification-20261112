import {
  getSignatureFromTransaction,
  sendTransactionWithoutConfirmingFactory,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit"
import { type SendableTransaction } from "../../types"
import { type SolanaTxHandle } from "../types"

/**
 * Standard `send`: send without confirming; the signature IS the on-chain
 * signature. Parallel to the EVM kit's `eoa/send.ts`.
 */
export const standardSend = async (
  rpc: Rpc<SolanaRpcApi>,
  signed: SendableTransaction,
): Promise<SolanaTxHandle & { kind: "standard" }> => {
  const signature = getSignatureFromTransaction(signed)
  const send = sendTransactionWithoutConfirmingFactory({ rpc })
  await send(signed, { commitment: "confirmed", skipPreflight: true })
  return { kind: "standard", signature: signature as string }
}
