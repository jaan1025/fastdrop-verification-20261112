import { type UseMutationOptions } from "@tanstack/react-query"
import { type Address, type PublicClient, type TransactionReceipt } from "viem"
import { type Config } from "wagmi"
import { getWalletClient } from "wagmi/actions"
import { walletTx } from "../../transaction"
import { transfer } from "../../token/functions"

export interface TokenTransferParams {
  token: Address
  to: Address
  amount: bigint
}

export type TokenTransferData = TransactionReceipt

/**
 * Generic ERC-20 transfer write — React-free mutationOptions factory. The
 * mutationFn runs preflight (`ensureChainSwitched`), resolves the wallet client
 * AFTER the switch (the staleness guard), then sends through `sendAndConfirm`
 * (Safe support + revert decode). No Clique ABI registry — generic kit write.
 */
export const evmTokenTransferMutationOptions = (params: {
  chainId: number
  publicClient: PublicClient | undefined
  config: Config
  ensureChainSwitched: () => Promise<void>
}) =>
  ({
    mutationKey: ["evm", "erc20", "transfer"] as const,
    mutationFn: async (variables: TokenTransferParams) => {
      const { chainId, publicClient, config, ensureChainSwitched } = params
      if (!publicClient) throw new Error("Public client is required")
      await ensureChainSwitched()
      const walletClient = await getWalletClient(config, { chainId })
      return walletTx.sendAndConfirm(
        {
          write: () => transfer(publicClient, walletClient, variables),
          account: walletClient.account!.address,
          publicClient,
        },
        { publicClient },
      )
    },
  }) satisfies UseMutationOptions<TokenTransferData, Error, TokenTransferParams>
