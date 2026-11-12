"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  solanaStreamRevocationQueryOptions,
  type SolanaStreamRevocation,
  type SolanaStreamRevocationQueryKey,
} from "../../../../../query/distributor/strategies/lock"

export type UseStreamRevocationParameters = {
  base: Address | undefined
  root: `0x${string}` | undefined
  /** Resolved claimer (`extra.recipient ?? addressHandler`). */
  recipient: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<
  SolanaStreamRevocation,
  Error,
  SolanaStreamRevocation,
  SolanaStreamRevocationQueryKey
>

export const useStreamRevocation = (parameters: UseStreamRevocationParameters) => {
  const { query, rpc, chain, ...params } = parameters

  return useQuery({
    ...solanaStreamRevocationQueryOptions({ ...params, chain, rpc }),
    ...query,
  })
}
