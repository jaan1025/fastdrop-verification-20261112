import { catchRevert } from "../../../errors/catch"
import { type ErrorAbis } from "../../../errors/abis"
import { type EvmTxHandle } from "../types"

/**
 * EOA `send`: wraps the write closure with revert-decode and returns
 * `{ kind: 'eoa', hash }` immediately after broadcast.
 */
export const eoaSend = async (
  write: () => Promise<`0x${string}`>,
  errorAbis?: ErrorAbis,
): Promise<EvmTxHandle & { kind: "eoa" }> => {
  const hash = await catchRevert(write, errorAbis)
  return { kind: "eoa", hash }
}
