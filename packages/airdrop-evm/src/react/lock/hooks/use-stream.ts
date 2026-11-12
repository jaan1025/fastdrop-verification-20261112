"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import { evmStreamQueryOptions, type UseStreamParameters } from "../../../query/lock"

export const useStream = (parameters: UseStreamParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmStreamQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
