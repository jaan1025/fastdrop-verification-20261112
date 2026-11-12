"use client"
import { type Address, type Commitment, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "../../config/network"
import {
  solanaNativeBalanceQueryOptions,
  type NativeBalanceData,
  type NativeBalanceQueryKey,
} from "../../query/token/native-balance"

export type UseNativeBalanceParameters<TData = NativeBalanceData> = {
  address: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
  /** Read commitment; see `solanaNativeBalanceQueryOptions`. */
  commitment?: Commitment
} & QueryParameter<NativeBalanceData, Error, TData, NativeBalanceQueryKey>

/** SOL balance for a wallet. */
export const useNativeBalance = <TData = NativeBalanceData>(
  parameters: UseNativeBalanceParameters<TData>,
) => {
  const { query, address, rpc, chain, commitment } = parameters
  return useQuery({
    ...solanaNativeBalanceQueryOptions({ chain, rpc, address, commitment }),
    ...query,
  })
}
