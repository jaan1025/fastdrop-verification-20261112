import { walletTx, type EvmTxHandle } from "@repo/chain-evm-kit/transaction"
import { type PublicClient } from "viem"
import { DEFAULT_ERROR_ABIS } from "../errors/default-error-abis"

export type { EvmTxHandle }

/**
 * Send an EVM transaction with the Clique ABI list baked in — the send-half
 * mirror of `confirmTransaction`. Write ops (`claim`, `lockHookClaim`,
 * `revokeStream`, `setStreamPreset`) call this instead of threading
 * `DEFAULT_ERROR_ABIS` into the kit's `walletTx.send`; the DI converges here.
 */
export const sendTransaction = (params: {
  write: () => Promise<`0x${string}`>
  account: `0x${string}`
  publicClient: PublicClient
}): Promise<EvmTxHandle> => walletTx.send({ ...params, errorAbis: DEFAULT_ERROR_ABIS })
