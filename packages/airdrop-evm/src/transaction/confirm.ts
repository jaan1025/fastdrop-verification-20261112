import { walletTx, type EvmTxHandle } from "@repo/chain-evm-kit/transaction"
import { type PublicClient, type TransactionReceipt } from "viem"
import { DEFAULT_ERROR_ABIS } from "../errors/default-error-abis"

/**
 * Confirm an EVM transaction handle with the Clique ABI registry baked in.
 *
 * Callers (e.g. `airdrop-app-shared` claim facades) pass a handle returned by
 * any of the `airdrop-evm` write ops (`claim`, `lockHookClaim`, `revokeStream`,
 * `setStreamPreset`) and a `publicClient`; the `DEFAULT_ERROR_ABIS` is
 * injected here — callers never need to thread it.
 */
export const confirmTransaction = (
  handle: EvmTxHandle,
  ctx: { publicClient: PublicClient },
): Promise<TransactionReceipt> =>
  walletTx.confirm(handle, {
    publicClient: ctx.publicClient,
    errorAbis: DEFAULT_ERROR_ABIS,
  })
