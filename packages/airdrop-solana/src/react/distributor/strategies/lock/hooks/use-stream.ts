"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  solanaStreamQueryOptions,
  type SolanaStreamData,
  type SolanaStreamQueryKey,
} from "../../../../../query/distributor/strategies/lock"

export type UseStreamParameters = {
  base: Address | undefined
  root: `0x${string}` | undefined
  /** Resolved claimer (`extra.recipient ?? addressHandler`). */
  recipient: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<SolanaStreamData, Error, SolanaStreamData, SolanaStreamQueryKey>

export const useStream = (parameters: UseStreamParameters) => {
  const { query, rpc, chain, ...params } = parameters

  return useQuery({
    ...solanaStreamQueryOptions({ ...params, chain, rpc }),
    ...query,
  })
}
