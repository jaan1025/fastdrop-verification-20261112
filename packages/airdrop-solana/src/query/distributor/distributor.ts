import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  fetchMerkleDistributor,
  type MerkleDistributor,
} from "../../contracts/distributor/functions"
import { airdropSolanaKeys } from "../keys"

export type SolanaDistributorData = MerkleDistributor | null
export type SolanaDistributorQueryKey = ReturnType<typeof airdropSolanaKeys.distributor>

export const solanaDistributorQueryOptions = (params: {
  chain: SolanaChain
  distributor: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, distributor } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.distributor({ chain, distributor }),
    queryFn:
      rpc && distributor
        ? (): Promise<SolanaDistributorData> => fetchMerkleDistributor(rpc, distributor)
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
