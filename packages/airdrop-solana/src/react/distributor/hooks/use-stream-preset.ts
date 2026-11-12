"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  solanaStreamPresetQueryOptions,
  type SolanaStreamPresetData,
  type SolanaStreamPresetQueryKey,
} from "../../../query/distributor"

export type UseStreamPresetParameters = {
  distributor: Address | undefined
  configurator: Uint8Array | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<
  SolanaStreamPresetData,
  Error,
  SolanaStreamPresetData,
  SolanaStreamPresetQueryKey
>

export const useStreamPreset = (parameters: UseStreamPresetParameters) => {
  const { query, rpc, chain, ...params } = parameters
  return useQuery({
    ...solanaStreamPresetQueryOptions({ ...params, chain, rpc }),
    ...query,
  })
}
