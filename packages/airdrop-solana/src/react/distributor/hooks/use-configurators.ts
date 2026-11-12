"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  solanaConfiguratorsQueryOptions,
  type SolanaConfiguratorsData,
  type SolanaConfiguratorsQueryKey,
} from "../../../query/distributor"

export type UseConfiguratorsParameters = {
  appId: string
  deployment: string
  batch: string | undefined
  base: Address | undefined
  root: `0x${string}` | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<
  SolanaConfiguratorsData,
  Error,
  SolanaConfiguratorsData,
  SolanaConfiguratorsQueryKey
>

export const useConfigurators = (parameters: UseConfiguratorsParameters) => {
  const { query, rpc, chain, ...params } = parameters

  return useQuery({
    ...solanaConfiguratorsQueryOptions({ ...params, chain, rpc }),
    ...query,
  })
}
