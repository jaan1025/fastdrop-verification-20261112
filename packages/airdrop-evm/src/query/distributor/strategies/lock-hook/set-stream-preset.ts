import { type UseMutationOptions } from "@tanstack/react-query"
import { type Address, type Hash, type PublicClient, type TransactionReceipt } from "viem"
import { getWalletClient } from "wagmi/actions"
import { type Config } from "wagmi"
import {
  setStreamPreset,
  type StreamPreset,
} from "../../../../contracts/distributor/strategies/lock-hook/functions"
import { confirmTransaction } from "../../../../transaction/confirm"

export type { StreamPreset }

export interface SetStreamPresetParams {
  lockHook: Address
  distributor: Address
  configurationId: Hash
  preset: StreamPreset
}

export type SetStreamPresetData = TransactionReceipt

/**
 * LockHook set-stream-preset write — React-free factory. The mutationFn owns the
 * load-bearing choreography: run preflight (`ensureChainSwitched`), resolve the
 * wallet client AFTER the switch (the staleness guard), call `setStreamPreset`
 * which returns an `EvmTxHandle`, then `confirmTransaction` (baked with
 * {@link DEFAULT_ERROR_ABIS}) waits for the receipt and decodes any revert.
 * The wagmi runtime (chain-pinned publicClient, `config`, `ensureChainSwitched`)
 * is injected by the `useSetStreamPreset` hook. No UX side-effects.
 */
export const evmSetStreamPresetMutationOptions = (params: {
  chainId: number
  publicClient: PublicClient | undefined
  config: Config
  ensureChainSwitched: () => Promise<void>
}) =>
  ({
    mutationKey: ["evm", "lockHook", "setStreamPreset"] as const,
    mutationFn: async (variables: SetStreamPresetParams) => {
      const { chainId, publicClient, config, ensureChainSwitched } = params
      if (!publicClient) throw new Error("Public client is required")
      await ensureChainSwitched()
      const walletClient = await getWalletClient(config, { chainId })
      const handle = await setStreamPreset(publicClient, walletClient, variables)
      return confirmTransaction(handle, { publicClient })
    },
  }) satisfies UseMutationOptions<SetStreamPresetData, Error, SetStreamPresetParams>
