"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  solanaDistributorQueryOptions,
  type SolanaDistributorData,
  type SolanaDistributorQueryKey,
} from "../../../query/distributor"

export type UseDistributorParameters = {
  distributor: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<SolanaDistributorData, Error, SolanaDistributorData, SolanaDistributorQueryKey>

/** Full MerkleDistributor account. */
export const useDistributor = (parameters: UseDistributorParameters) => {
  const { query, distributor, rpc, chain } = parameters
  return useQuery({
    ...solanaDistributorQueryOptions({ chain, distributor, rpc }),
    ...query,
  })
}
