import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getClaimableAmount, streamCacheId, type Stream } from "../../contracts/lock/functions"
import { airdropEvmKeys } from "../keys"

type ClaimableAmountInputs = {
  lock: Address | undefined
  stream: Stream | undefined
}

export type EvmClaimableAmountData = Awaited<ReturnType<typeof getClaimableAmount>>
export type EvmClaimableAmountQueryKey = ReturnType<typeof airdropEvmKeys.claimableAmount>

export const evmClaimableAmountQueryOptions = (
  params: ClaimableAmountInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, lock, stream, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.claimableAmount({
      chainId,
      lock,
      streamIdentifier: stream ? streamCacheId(stream) : undefined,
    }),
    queryFn:
      publicClient && lock && stream
        ? () => getClaimableAmount(publicClient, { lock, stream })
        : skipToken,
    // `calculateClaimableAmount` grows with `block.timestamp` — NOT immutable, and
    // it carries no baked caching policy. Consumers opt into staleness/polling via
    // `query: { staleTime, refetchInterval, … }` (the use-native-balance
    // convention) so each call site owns its own freshness needs.
  })
}

export type UseClaimableAmountParameters = ClaimableAmountInputs & {
  chainId: number
} & QueryParameter<
    EvmClaimableAmountData,
    Error,
    EvmClaimableAmountData,
    EvmClaimableAmountQueryKey
  >
