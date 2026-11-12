"use client"
import { useMutation } from "@tanstack/react-query"
import { useConfig, usePublicClient } from "wagmi"
import type { MutationParameter } from "@repo/acs-client/react"
import { useEnsureChainSwitched } from "../wallet/use-ensure-chain-switched"
import {
  evmTokenTransferMutationOptions,
  type TokenTransferData,
  type TokenTransferParams,
} from "../../query/token/transfer"

export type UseTokenTransferParameters<TContext = unknown> = {
  chainId: number
} & MutationParameter<TokenTransferData, Error, TokenTransferParams, TContext>

/**
 * Generic ERC-20 transfer. Thin consumer wiring: resolves the wagmi runtime and
 * spreads {@link evmTokenTransferMutationOptions} into `useMutation`.
 */
export const useTokenTransfer = <TContext = unknown>(
  parameters: UseTokenTransferParameters<TContext>,
) => {
  const { chainId, mutation } = parameters
  const publicClient = usePublicClient({ chainId })
  const config = useConfig()
  const { ensureChainSwitched } = useEnsureChainSwitched({ chainId })

  return useMutation({
    ...evmTokenTransferMutationOptions({
      chainId,
      publicClient,
      config,
      ensureChainSwitched,
    }),
    ...mutation,
  })
}
