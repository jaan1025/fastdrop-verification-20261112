"use client"
import { useMutation } from "@tanstack/react-query"
import { useConfig, usePublicClient } from "wagmi"
import { type MutationParameter } from "@repo/acs-client/react"
import { useEnsureChainSwitched } from "@repo/chain-evm-kit/react"
import {
  evmSetStreamPresetMutationOptions,
  type SetStreamPresetParams,
  type SetStreamPresetData,
} from "../../../../../query/distributor/strategies/lock-hook"

export interface UseSetStreamPresetOptions {
  chainId: number
}

export type UseSetStreamPresetParameters<TContext = unknown> = UseSetStreamPresetOptions &
  MutationParameter<SetStreamPresetData, Error, SetStreamPresetParams, TContext>

/**
 * LockHook set-stream-preset. Thin consumer/flow boundary: resolves the wagmi
 * runtime and spreads the React-free {@link evmSetStreamPresetMutationOptions}
 * into `useMutation`. No UX side-effects.
 */
export const useSetStreamPreset = <TContext = unknown>(
  parameters: UseSetStreamPresetParameters<TContext>,
) => {
  const { chainId, mutation } = parameters
  const publicClient = usePublicClient({ chainId })
  const config = useConfig()
  const { ensureChainSwitched } = useEnsureChainSwitched({ chainId })

  return useMutation({
    ...evmSetStreamPresetMutationOptions({
      chainId,
      publicClient,
      config,
      ensureChainSwitched,
    }),
    ...mutation,
  })
}
