"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "../../config/network"
import {
  solanaAccountTransactionsQueryOptions,
  type AccountTransactionsData,
  type AccountTransactionsQueryKey,
} from "../../query/token/account-transactions"

export type UseAccountTransactionsParameters = {
  address: Address | undefined
  limit?: number
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<
  AccountTransactionsData,
  Error,
  AccountTransactionsData,
  AccountTransactionsQueryKey
>

/** Recent successful transaction signatures, newest-first. */
export const useAccountTransactions = (parameters: UseAccountTransactionsParameters) => {
  const { query, address, limit, rpc, chain } = parameters

  return useQuery({
    ...solanaAccountTransactionsQueryOptions({ chain, address, limit, rpc }),
    ...query,
  })
}
