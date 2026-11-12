"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "../../config/network"
import {
  solanaMintInfoQueryOptions,
  type MintInfoData,
  type MintInfoQueryKey,
} from "../../query/token/mint-info"

export type UseMintInfoParameters = {
  mint: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<MintInfoData, Error, MintInfoData, MintInfoQueryKey>

/** SPL mint account. */
export const useMintInfo = (parameters: UseMintInfoParameters) => {
  const { query, mint, rpc, chain } = parameters
  return useQuery({
    ...solanaMintInfoQueryOptions({ chain, mint, rpc }),
    ...query,
  })
}
