"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import { evmTokenQueryOptions, type UseTokenParameters } from "../../../query/distributor/token"

export const useToken = (parameters: UseTokenParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmTokenQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
