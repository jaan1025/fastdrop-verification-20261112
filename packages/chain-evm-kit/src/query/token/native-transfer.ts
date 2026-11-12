import { type UseMutationOptions } from "@tanstack/react-query"
import { type Address, type PublicClient, type TransactionReceipt } from "viem"
import { type Config } from "wagmi"
import { getWalletClient } from "wagmi/actions"
import { walletTx } from "../../transaction"

export interface EvmNativeTransferParams {
  to: Address
  value: bigint
}

export type EvmNativeTransferData = TransactionReceipt

/**
 * Generic native-coin transfer write — React-free mutationOptions factory. The
 * mutationFn runs preflight (`ensureChainSwitched`), resolves the wallet client
 * AFTER the switch (the staleness guard), then sends through `sendAndConfirm`
 * (Safe support + revert decode). No Clique ABI registry — this is a generic
 * kit write, so reverts fall back to the raw viem message.
 */
export const evmNativeTransferMutationOptions = (params: {
  chainId: number
  publicClient: PublicClient | undefined
  config: Config
  ensureChainSwitched: () => Promise<void>
}) =>
  ({
    mutationKey: ["evm", "nativeTransfer"] as const,
    mutationFn: async ({ to, value }: EvmNativeTransferParams) => {
      const { chainId, publicClient, config, ensureChainSwitched } = params
      if (!publicClient) throw new Error("Public client is required")
      await ensureChainSwitched()
      const walletClient = await getWalletClient(config, { chainId })
      return walletTx.sendAndConfirm(
        {
          write: () =>
            walletClient.sendTransaction({
              account: walletClient.account!,
              chain: walletClient.chain,
              to,
              value,
            }),
          account: walletClient.account!.address,
          publicClient,
        },
        { publicClient },
      )
    },
  }) satisfies UseMutationOptions<EvmNativeTransferData, Error, EvmNativeTransferParams>
