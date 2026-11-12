"use client"
import { type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  solanaFeeConfigQueryOptions,
  type SolanaFeeConfigData,
  type SolanaFeeConfigQueryKey,
} from "../../../query/distributor"

export type UseFeeConfigParameters = {
  chain: SolanaChain
  distributor: string | undefined
  root: `0x${string}` | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
} & QueryParameter<SolanaFeeConfigData, Error, SolanaFeeConfigData, SolanaFeeConfigQueryKey>

export const useFeeConfig = (parameters: UseFeeConfigParameters) => {
  const { query, rpc, chain, ...params } = parameters

  return useQuery({
    ...solanaFeeConfigQueryOptions({ ...params, chain, rpc }),
    ...query,
  })
}
