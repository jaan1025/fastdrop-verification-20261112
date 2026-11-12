"use client"
import { useMutation } from "@tanstack/react-query"
import { useConfig, usePublicClient } from "wagmi"
import { type MutationParameter } from "@repo/acs-client/react"
import { useEnsureChainSwitched } from "@repo/chain-evm-kit/react"
import {
  evmRevokeStreamMutationOptions,
  type RevokeStreamParams,
  type RevokeStreamData,
} from "../../../query/lock"

export interface UseRevokeStreamOptions {
  chainId: number
}

export type UseRevokeStreamParameters<TContext = unknown> = UseRevokeStreamOptions &
  MutationParameter<RevokeStreamData, Error, RevokeStreamParams, TContext>

/**
 * CliqueLock revoke-stream. Thin consumer/flow boundary: resolves the wagmi
 * runtime and spreads the React-free {@link evmRevokeStreamMutationOptions}
 * into `useMutation`. No UX side-effects.
 */
export const useRevokeStream = <TContext = unknown>(
  parameters: UseRevokeStreamParameters<TContext>,
) => {
  const { chainId, mutation } = parameters
  const publicClient = usePublicClient({ chainId })
  const config = useConfig()
  const { ensureChainSwitched } = useEnsureChainSwitched({ chainId })

  return useMutation({
    ...evmRevokeStreamMutationOptions({
      chainId,
      publicClient,
      config,
      ensureChainSwitched,
    }),
    ...mutation,
  })
}
