"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  solanaConfigurationQueryOptions,
  type SolanaConfigurationData,
  type SolanaConfigurationQueryKey,
} from "../../../query/distributor"

export type UseConfigurationParameters = {
  base: Address | undefined
  root: `0x${string}` | undefined
  configurationIndex?: number
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<
  SolanaConfigurationData,
  Error,
  SolanaConfigurationData,
  SolanaConfigurationQueryKey
>

export const useConfiguration = (parameters: UseConfigurationParameters) => {
  const { query, rpc, chain, ...params } = parameters

  return useQuery({
    ...solanaConfigurationQueryOptions({ ...params, chain, rpc }),
    ...query,
  })
}
