import { logger } from "../utils/logger"
import {
  compileTransaction,
  getBase64EncodedWireTransaction,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit"
import { formatRpcError, type ProgramErrorResolver } from "../errors"

type CompilableMessage = Parameters<typeof compileTransaction>[0]

export interface SimulationResult {
  success: boolean
  error?: unknown
  errorMessage?: string
  logs?: string[]
  unitsConsumed?: bigint
}

/**
 * Simulate a transaction message before signing.
 *
 * @see https://solana.com/docs/rpc/http/simulatetransaction
 */
export const simulate = async (
  rpc: Rpc<SolanaRpcApi>,
  message: CompilableMessage,
  resolveProgramError?: ProgramErrorResolver,
): Promise<SimulationResult> => {
  const unsignedTransaction = compileTransaction(message)
  const base64Tx = getBase64EncodedWireTransaction(unsignedTransaction)

  const result = await rpc
    .simulateTransaction(base64Tx, {
      commitment: "confirmed",
      encoding: "base64",
      replaceRecentBlockhash: true,
      sigVerify: false,
    })
    .send()

  const { value } = result

  if (value.err) {
    logger.error("simulation error", value.err)
    return {
      success: false,
      error: value.err,
      errorMessage: formatRpcError(value.err, value.logs, resolveProgramError),
      logs: value.logs ?? undefined,
      unitsConsumed: value.unitsConsumed ?? undefined,
    }
  }

  return {
    success: true,
    logs: value.logs ?? undefined,
    unitsConsumed: value.unitsConsumed ?? undefined,
  }
}
