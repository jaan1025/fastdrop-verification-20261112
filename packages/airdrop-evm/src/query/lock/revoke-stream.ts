import { type UseMutationOptions } from "@tanstack/react-query"
import { type Address, type PublicClient, type TransactionReceipt } from "viem"
import { getWalletClient } from "wagmi/actions"
import { type Config } from "wagmi"
import { revokeStream } from "../../contracts/lock/functions"
import { confirmTransaction } from "../../transaction/confirm"

export interface RevokeStreamParams {
  lock: Address
  streamId: bigint
}

export type RevokeStreamData = TransactionReceipt

/**
 * CliqueLock revoke-stream write — React-free factory. The mutationFn owns the
 * load-bearing choreography: run preflight (`ensureChainSwitched`), resolve the
 * wallet client AFTER the switch (a render-captured client is stale right after
 * a mid-flow connect — the staleness guard), call `revokeStream` which returns
 * an `EvmTxHandle`, then `confirmTransaction` (baked with
 * {@link DEFAULT_ERROR_ABIS}) waits for the receipt and decodes any revert.
 * The wagmi runtime (chain-pinned publicClient, `config`, `ensureChainSwitched`)
 * is injected by the `useRevokeStream` hook. No UX side-effects.
 */
export const evmRevokeStreamMutationOptions = (params: {
  chainId: number
  publicClient: PublicClient | undefined
  config: Config
  ensureChainSwitched: () => Promise<void>
}) =>
  ({
    mutationKey: ["evm", "lock", "revokeStream"] as const,
    mutationFn: async (variables: RevokeStreamParams) => {
      const { chainId, publicClient, config, ensureChainSwitched } = params
      if (!publicClient) throw new Error("Public client is required")
      await ensureChainSwitched()
      const walletClient = await getWalletClient(config, { chainId })
      const handle = await revokeStream(publicClient, walletClient, variables)
      return confirmTransaction(handle, { publicClient })
    },
  }) satisfies UseMutationOptions<RevokeStreamData, Error, RevokeStreamParams>
