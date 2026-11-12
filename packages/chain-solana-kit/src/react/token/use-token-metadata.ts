"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "../../config/network"
import {
  solanaTokenMetadataQueryOptions,
  type TokenMetadataData,
  type TokenMetadataQueryKey,
} from "../../query/token/metadata"

export type UseTokenMetadataParameters = {
  mint: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<TokenMetadataData, Error, TokenMetadataData, TokenMetadataQueryKey>

/** Metaplex Token Metadata. Null for unregistered mints. */
export const useTokenMetadata = (parameters: UseTokenMetadataParameters) => {
  const { query, mint, rpc, chain } = parameters
  return useQuery({
    ...solanaTokenMetadataQueryOptions({ chain, mint, rpc }),
    ...query,
  })
}
