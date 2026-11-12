"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient as useAcsPublicClient } from "@repo/acs-client/react"
import { evmMerkleRootQueryOptions, type UseMerkleRootParameters } from "../../../query/distributor"

export const useMerkleRoot = (parameters: UseMerkleRootParameters) => {
  const { query, ...params } = parameters
  const acsClient = useAcsPublicClient()
  return useQuery({
    ...evmMerkleRootQueryOptions(acsClient, params),
    ...query,
  })
}
