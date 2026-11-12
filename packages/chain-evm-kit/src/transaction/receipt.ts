import { type PublicClient, type TransactionReceipt, pad } from "viem"
import { getRevertMessageForTx } from "../errors/format"
import { type ErrorAbis } from "../errors/abis"

/**
 * The EVM public client {@link waitForTransactionReceipt} reads a receipt
 * through — viem's `PublicClient` (a wagmi public client satisfies it). The
 * kit-owned name for the finality/deploy client the confirm facade and the
 * deploy-client family pass around.
 */
export type WaitForReceiptClient = PublicClient

/**
 * Waits for a transaction receipt and handles replacements/cancellations.
 * Decodes revert reasons if the transaction fails AND an `errorAbis` is
 * supplied (the kit carries no Clique default — callers inject their registry).
 * Without one, a revert surfaces the generic `Transaction reverted` message.
 */
export const waitForTransactionReceipt = async (
  publicClient: WaitForReceiptClient,
  hash: `0x${string}`,
  errorAbis?: ErrorAbis,
): Promise<TransactionReceipt> => {
  let canceledWithTransactionReceipt: TransactionReceipt | undefined
  let replacedWithTransactionReceipt: TransactionReceipt | undefined
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: pad(hash, { size: 32 }), // Defensive patching of hash formats.
    onReplaced: (response) => {
      if (response.reason === "cancelled") {
        canceledWithTransactionReceipt = response.transactionReceipt
      } else {
        replacedWithTransactionReceipt = response.transactionReceipt
      }
    },
  })

  if (canceledWithTransactionReceipt) {
    throw new Error("failed: Transaction canceled")
  }

  if (replacedWithTransactionReceipt) {
    if (replacedWithTransactionReceipt.status === "reverted") {
      const message = errorAbis
        ? await getRevertMessageForTx(
            publicClient,
            replacedWithTransactionReceipt.transactionHash,
            errorAbis,
          )
        : undefined
      if (message) throw new Error(`failed: ${message}`)
      throw new Error("failed: Transaction reverted")
    }
    return replacedWithTransactionReceipt
  }

  if (receipt?.status === "reverted") {
    const message = errorAbis
      ? await getRevertMessageForTx(publicClient, hash, errorAbis)
      : undefined
    if (message) throw new Error(`failed: ${message}`)
    throw new Error("failed: Transaction reverted")
  }

  return receipt
}
