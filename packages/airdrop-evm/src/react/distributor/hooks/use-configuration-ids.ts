"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmConfigurationIdsQueryOptions,
  type UseConfigurationIdsParameters,
} from "../../../query/distributor"

export const useConfigurationIds = (parameters: UseConfigurationIdsParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmConfigurationIdsQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
