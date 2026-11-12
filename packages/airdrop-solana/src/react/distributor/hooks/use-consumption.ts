"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  solanaConsumptionQueryOptions,
  type SolanaConsumptionData,
  type SolanaConsumptionQueryKey,
} from "../../../query/distributor"

export type UseConsumptionParameters = {
  appId: string
  deployment: string
  batch: string | undefined
  base: Address | undefined
  root: `0x${string}` | undefined
  /** Merkle-leaf / allocation key (`addressHandler`) — the on-chain `consumed`
   * status is per-leaf, keyed by the handler, not the resolved recipient. */
  handler: string | undefined
  dynamicRecipient?: boolean
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<SolanaConsumptionData, Error, SolanaConsumptionData, SolanaConsumptionQueryKey>

export const useConsumption = (parameters: UseConsumptionParameters) => {
  const { query, rpc, chain, ...params } = parameters

  return useQuery({
    ...solanaConsumptionQueryOptions({ ...params, chain, rpc }),
    ...query,
  })
}
