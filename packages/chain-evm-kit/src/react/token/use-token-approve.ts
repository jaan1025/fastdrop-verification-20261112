"use client"
import { useMutation } from "@tanstack/react-query"
import { useConfig, usePublicClient } from "wagmi"
import type { MutationParameter } from "@repo/acs-client/react"
import { useEnsureChainSwitched } from "../wallet/use-ensure-chain-switched"
import {
  evmTokenApproveMutationOptions,
  type TokenApproveData,
  type TokenApproveParams,
} from "../../query/token/approve"

export type UseTokenApproveParameters<TContext = unknown> = {
  chainId: number
} & MutationParameter<TokenApproveData, Error, TokenApproveParams, TContext>

/**
 * Generic ERC-20 approve. Thin consumer wiring: resolves the wagmi runtime and
 * spreads {@link evmTokenApproveMutationOptions} into `useMutation`.
 */
export const useTokenApprove = <TContext = unknown>(
  parameters: UseTokenApproveParameters<TContext>,
) => {
  const { chainId, mutation } = parameters
  const publicClient = usePublicClient({ chainId })
  const config = useConfig()
  const { ensureChainSwitched } = useEnsureChainSwitched({ chainId })

  return useMutation({
    ...evmTokenApproveMutationOptions({
      chainId,
      publicClient,
      config,
      ensureChainSwitched,
    }),
    ...mutation,
  })
}
