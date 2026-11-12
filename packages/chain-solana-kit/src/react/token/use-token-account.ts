"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "../../config/network"
import {
  solanaTokenAccountQueryOptions,
  type TokenAccountData,
  type TokenAccountQueryKey,
} from "../../query/token/account"

export type UseTokenAccountParameters = {
  tokenAccount: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<TokenAccountData, Error, TokenAccountData, TokenAccountQueryKey>

/** SPL token account. */
export const useTokenAccount = (parameters: UseTokenAccountParameters) => {
  const { query, tokenAccount, rpc, chain } = parameters
  return useQuery({
    ...solanaTokenAccountQueryOptions({ chain, tokenAccount, rpc }),
    ...query,
  })
}
