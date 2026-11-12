"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmStreamPresetQueryOptions,
  type UseStreamPresetParameters,
} from "../../../../../query/distributor/strategies/lock-hook"

export const useStreamPreset = (parameters: UseStreamPresetParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmStreamPresetQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
