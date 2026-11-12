import { type UseMutationOptions } from "@tanstack/react-query"
import { type Address, type PublicClient, type TransactionReceipt } from "viem"
import { type Config } from "wagmi"
import { getWalletClient } from "wagmi/actions"
import { walletTx } from "../../transaction"
import { approve } from "../../token/functions"

export interface TokenApproveParams {
  token: Address
  spender: Address
  amount: bigint
}

export type TokenApproveData = TransactionReceipt

/**
 * Generic ERC-20 approve write — React-free mutationOptions factory. The
 * mutationFn runs preflight (`ensureChainSwitched`), resolves the wallet client
 * AFTER the switch (the staleness guard), then sends through `sendAndConfirm`
 * (Safe support + revert decode). No Clique ABI registry — generic kit write.
 */
export const evmTokenApproveMutationOptions = (params: {
  chainId: number
  publicClient: PublicClient | undefined
  config: Config
  ensureChainSwitched: () => Promise<void>
}) =>
  ({
    mutationKey: ["evm", "erc20", "approve"] as const,
    mutationFn: async (variables: TokenApproveParams) => {
      const { chainId, publicClient, config, ensureChainSwitched } = params
      if (!publicClient) throw new Error("Public client is required")
      await ensureChainSwitched()
      const walletClient = await getWalletClient(config, { chainId })
      return walletTx.sendAndConfirm(
        {
          write: () => approve(publicClient, walletClient, variables),
          account: walletClient.account!.address,
          publicClient,
        },
        { publicClient },
      )
    },
  }) satisfies UseMutationOptions<TokenApproveData, Error, TokenApproveParams>
