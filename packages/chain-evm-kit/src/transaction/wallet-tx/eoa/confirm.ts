import { type PublicClient, type TransactionReceipt } from "viem"
import { waitForTransactionReceipt } from "../../receipt"
import { type ErrorAbis } from "../../../errors/abis"
import { type EvmTxHandle } from "../types"

/**
 * EOA `confirm`: waits for the receipt, decoding any revert reason via the
 * injected `errorAbis`.
 */
export const eoaConfirm = (
  handle: EvmTxHandle & { kind: "eoa" },
  publicClient: PublicClient,
  errorAbis?: ErrorAbis,
): Promise<TransactionReceipt> => waitForTransactionReceipt(publicClient, handle.hash, errorAbis)
