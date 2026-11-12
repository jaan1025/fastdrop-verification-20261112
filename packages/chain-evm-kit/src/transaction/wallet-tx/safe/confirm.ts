import { type PublicClient, type TransactionReceipt } from "viem"
import { type ErrorAbis } from "../../../errors/abis"
import { type EvmTxHandle } from "../types"
import { confirm } from "./primitives/confirm"

/**
 * Safe `confirm`: thin adapter — unwrap the handle and delegate to the
 * `primitives/confirm` composition (execution-event wait → on-chain-hash gate →
 * receipt). Parallel to the Solana kit's `squadsx/confirm.ts`.
 */
export const safeConfirm = (
  handle: EvmTxHandle & { kind: "safe" },
  publicClient: PublicClient,
  errorAbis?: ErrorAbis,
): Promise<TransactionReceipt> =>
  confirm({
    publicClient,
    safeAddress: handle.account,
    safeTxHash: handle.safeTxHash,
    fromBlock: handle.fromBlock,
    errorAbis,
  })
