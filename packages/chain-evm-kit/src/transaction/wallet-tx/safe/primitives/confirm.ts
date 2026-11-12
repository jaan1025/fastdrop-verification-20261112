import { type PublicClient, type TransactionReceipt } from "viem"
import { waitForTransactionReceipt } from "../../../receipt"
import { type ErrorAbis } from "../../../../errors/abis"
import { waitForExecution } from "./execution"

/**
 * Safe confirm composition: wait for the Safe's `ExecutionSuccess` /
 * `ExecutionFailure` event (key-free — no Safe Transaction Service), gate on
 * the outcome — throwing with the ON-CHAIN hash so the caller can build an
 * explorer link — then wait for the execution transaction's receipt. The
 * handle-level `../confirm.ts` adapts `EvmTxHandle` onto this.
 * (Solana mirror: `squadsx/primitives/confirm.ts`.)
 */
export const confirm = async (params: {
  publicClient: PublicClient
  safeAddress: `0x${string}`
  safeTxHash: `0x${string}`
  fromBlock: bigint
  errorAbis?: ErrorAbis
}): Promise<TransactionReceipt> => {
  const { publicClient, safeAddress, safeTxHash, fromBlock, errorAbis } = params
  const { onChainHash, success } = await waitForExecution({
    publicClient,
    safeAddress,
    safeTxHash,
    fromBlock,
  })

  if (!success) {
    throw new Error(`Safe transaction failed on-chain. On-chain hash: ${onChainHash}`)
  }

  return waitForTransactionReceipt(publicClient, onChainHash, errorAbis)
}
