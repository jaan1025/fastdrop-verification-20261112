"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmStreamIdQueryOptions,
  type UseStreamIdParameters,
} from "../../../../../query/distributor/strategies/lock-hook"

export const useStreamId = (parameters: UseStreamIdParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmStreamIdQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
