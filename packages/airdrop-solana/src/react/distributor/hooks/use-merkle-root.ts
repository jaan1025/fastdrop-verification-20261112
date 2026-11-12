"use client"
import { type Address } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient as useAcsPublicClient, type QueryParameter } from "@repo/acs-client/react"
import {
  solanaMerkleRootQueryOptions,
  type SolanaMerkleRootData,
  type SolanaMerkleRootQueryKey,
} from "../../../query/distributor"

export type UseMerkleRootParameters = {
  appId: string
  deployment: string
  batch: string | undefined
  /** Merkle-leaf / allocation key (`addressHandler`). */
  handler: Address | undefined
} & QueryParameter<SolanaMerkleRootData, Error, SolanaMerkleRootData, SolanaMerkleRootQueryKey>

export const useMerkleRoot = (parameters: UseMerkleRootParameters) => {
  const { query, ...params } = parameters
  const acsClient = useAcsPublicClient()
  return useQuery({
    ...solanaMerkleRootQueryOptions(acsClient, params),
    ...query,
  })
}
