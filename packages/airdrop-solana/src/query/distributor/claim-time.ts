import { type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import { airdropSolanaKeys } from "../keys"

export type SolanaClaimTimeData = bigint
export type SolanaClaimTimeQueryKey = ReturnType<typeof airdropSolanaKeys.claimTime>

/**
 * Block time of a claim slot (unix seconds) — the penalty curve's time input
 * for attribution. A SEPARATE query from the consumption read on purpose: the
 * consumption result caches forever (`staleTime: Infinity`), so a transient
 * `getBlockTime` failure must not be baked into it — here a failure THROWS,
 * letting react-query retry/refetch until the RPC recovers, and only a
 * successful (immutable per slot) reading is cached forever.
 */
export const solanaClaimTimeQueryOptions = (params: {
  chain: SolanaChain
  lastSlot: bigint | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, lastSlot } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.claimTime({
      chain,
      lastSlot: lastSlot?.toString(),
    }),
    queryFn:
      rpc && lastSlot !== undefined
        ? async (): Promise<SolanaClaimTimeData> => {
            const blockTime = await rpc.getBlockTime(lastSlot).send()
            if (blockTime == null) {
              throw new Error(`no block time for slot ${lastSlot}`)
            }
            return BigInt(blockTime)
          }
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
