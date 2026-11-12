"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmStreamRevocationQueryOptions,
  type UseStreamRevocationParameters,
} from "../../../query/lock"

export const useStreamRevocation = (parameters: UseStreamRevocationParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmStreamRevocationQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
