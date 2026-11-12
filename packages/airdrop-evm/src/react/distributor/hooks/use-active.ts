"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import { evmActiveQueryOptions, type UseActiveParameters } from "../../../query/distributor/active"

export const useActive = (parameters: UseActiveParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmActiveQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
