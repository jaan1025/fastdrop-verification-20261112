"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import { evmVaultQueryOptions, type UseVaultParameters } from "../../../query/distributor/vault"

export const useVault = (parameters: UseVaultParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmVaultQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
