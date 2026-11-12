import { type PublicClient, type TransactionReceipt } from "viem"
import { type ErrorAbis } from "../../errors/abis"
import { type EvmConfirmContext } from "./types"
import { sendTransaction } from "./send"
import { confirmTransaction } from "./confirm"

/**
 * Convenience: send then confirm in one call. Equivalent to:
 *   `confirmTransaction(await sendTransaction(params), ctx)`
 *
 * Use for admin ops where there is no resume UX — the caller awaits the full
 * receipt in a single `mutationFn`.
 */
export const sendAndConfirm = async (
  params: {
    write: () => Promise<`0x${string}`>
    account: `0x${string}`
    publicClient: PublicClient
    errorAbis?: ErrorAbis
  },
  ctx: EvmConfirmContext,
): Promise<TransactionReceipt> => {
  const handle = await sendTransaction(params)
  return confirmTransaction(handle, ctx)
}
