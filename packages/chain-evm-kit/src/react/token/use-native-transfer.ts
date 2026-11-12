"use client"
import { useMutation } from "@tanstack/react-query"
import { useConfig, usePublicClient } from "wagmi"
import type { MutationParameter } from "@repo/acs-client/react"
import { useEnsureChainSwitched } from "../wallet/use-ensure-chain-switched"
import {
  evmNativeTransferMutationOptions,
  type EvmNativeTransferData,
  type EvmNativeTransferParams,
} from "../../query/token/native-transfer"

export type UseNativeTransferParameters<TContext = unknown> = {
  chainId: number
} & MutationParameter<EvmNativeTransferData, Error, EvmNativeTransferParams, TContext>

/**
 * Generic native-coin transfer. Thin consumer wiring: resolves the wagmi runtime
 * and spreads {@link evmNativeTransferMutationOptions} into `useMutation`.
 */
export const useNativeTransfer = <TContext = unknown>(
  parameters: { chainId: number } & MutationParameter<
    EvmNativeTransferData,
    Error,
    EvmNativeTransferParams,
    TContext
  >,
) => {
  const { chainId, mutation } = parameters
  const publicClient = usePublicClient({ chainId })
  const config = useConfig()
  const { ensureChainSwitched } = useEnsureChainSwitched({ chainId })

  return useMutation({
    ...evmNativeTransferMutationOptions({
      chainId,
      publicClient,
      config,
      ensureChainSwitched,
    }),
    ...mutation,
  })
}
