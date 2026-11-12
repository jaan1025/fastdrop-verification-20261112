import { queryOptions, skipToken } from "@tanstack/react-query"
import { assembleClaimableMetrics, type Stream } from "../../contracts/lock/functions"
import { airdropSolanaKeys } from "../keys"

export interface SolanaClaimableAmountResult {
  claimable: bigint
  totalUnlocked: bigint
  claimed: bigint
  total: bigint
}

export type SolanaClaimableAmountData = SolanaClaimableAmountResult
export type SolanaClaimableAmountQueryKey = ReturnType<typeof airdropSolanaKeys.claimableAmount>

// Every Stream field participates exactly once, in struct order (mirrors the
// EVM `streamCacheId` + its pin test) — a preset change that alters only the
// unlock percentages / pieceDuration must bust this cache too.
const getStreamIdentifier = (stream: Stream | null | undefined) =>
  stream
    ? `${stream.recipient}-${stream.mint}-${stream.revokeAuthority}-${stream.amount}-${stream.claimedAmount}-${stream.startTime}-${stream.cliffTime}-${stream.endTime}-${stream.startUnlockPercentage}-${stream.cliffUnlockPercentage}-${Array.from(stream.pieceDuration).join(",")}`
    : undefined

export const solanaClaimableAmountQueryOptions = (params: {
  stream: Stream | null | undefined
}) => {
  const { stream } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.claimableAmount({
      streamIdentifier: getStreamIdentifier(stream),
    }),
    queryFn: stream
      ? async (): Promise<SolanaClaimableAmountData> => {
          // Wall-clock `now` stays at the edge; shaping is delegated.
          const now = BigInt(Math.floor(Date.now() / 1000))
          return assembleClaimableMetrics(stream, now)
        }
      : skipToken,
    // Claimable grows with wall-clock time — no baked caching policy here.
    // Consumers opt into staleness/polling via `query: { staleTime,
    // refetchInterval, … }` (the use-native-balance convention), keeping the
    // EVM/Solana claimable reads symmetric and consumer-controlled.
  })
}
