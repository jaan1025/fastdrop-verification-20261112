"use client"
import { type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  solanaClaimTimeQueryOptions,
  type SolanaClaimTimeData,
  type SolanaClaimTimeQueryKey,
} from "../../../query/distributor"

export type UseClaimTimeParameters = {
  lastSlot: bigint | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<SolanaClaimTimeData, Error, SolanaClaimTimeData, SolanaClaimTimeQueryKey>

export const useClaimTime = (parameters: UseClaimTimeParameters) => {
  const { query, rpc, chain, ...params } = parameters

  return useQuery({
    ...solanaClaimTimeQueryOptions({ ...params, chain, rpc }),
    ...query,
  })
}
