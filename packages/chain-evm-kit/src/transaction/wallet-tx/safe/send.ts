import { type PublicClient } from "viem"
import { catchRevert } from "../../../errors/catch"
import { type ErrorAbis } from "../../../errors/abis"
import { type EvmTxHandle } from "../types"

/**
 * Safe `send`: captures `fromBlock` before signing so the event watcher has a
 * tight lower bound, then broadcasts and returns
 * `{ kind: 'safe', safeTxHash, account, fromBlock }`.
 */
export const safeSend = async (
  write: () => Promise<`0x${string}`>,
  account: `0x${string}`,
  publicClient: PublicClient,
  errorAbis?: ErrorAbis,
): Promise<EvmTxHandle & { kind: "safe" }> => {
  const fromBlock = await publicClient.getBlockNumber()
  const safeTxHash = await catchRevert(write, errorAbis)
  return { kind: "safe", safeTxHash, account, fromBlock }
}
