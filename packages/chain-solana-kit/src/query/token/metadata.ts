import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import type { SolanaChain } from "../../config/network"
import { solanaKeys } from "../keys"
import { fetchTokenMetadata, type TokenMetadata } from "../../token/metadata"

export type TokenMetadataData = TokenMetadata | null
export type TokenMetadataQueryKey = ReturnType<typeof solanaKeys.tokenMetadata>

export const solanaTokenMetadataQueryOptions = (params: {
  chain: SolanaChain
  mint: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, mint } = params
  return queryOptions({
    queryKey: solanaKeys.tokenMetadata({ chain, mint }),
    queryFn: rpc && mint ? () => fetchTokenMetadata(rpc, mint) : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
