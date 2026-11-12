import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import {
  getStreamRevocation,
  type EvmStreamRevocation,
} from "../../contracts/lock/functions/stream-revocation"
import { airdropEvmKeys } from "../keys"

type StreamRevocationInputs = {
  lock: Address | undefined
  streamId: bigint | undefined
}

export type { EvmStreamRevocation }

export type EvmStreamRevocationQueryKey = ReturnType<typeof airdropEvmKeys.streamRevocation>

/**
 * Terminal-truth recovery for a deleted stream record: `StreamRevoked` logs
 * distinguish a revoke from a full claim, and Σ `StreamClaimed` is the
 * recipient's true received total either way. Only queried in a terminal
 * (record-deleted) state — the answer is immutable.
 */
export const evmStreamRevocationQueryOptions = (
  params: StreamRevocationInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, lock, streamId, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.streamRevocation({
      chainId,
      lock,
      streamId: streamId !== undefined ? String(streamId) : undefined,
    }),
    queryFn:
      publicClient && lock && streamId !== undefined
        ? () => getStreamRevocation(publicClient, { lock, streamId })
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export type UseStreamRevocationParameters = StreamRevocationInputs & {
  chainId: number
} & QueryParameter<EvmStreamRevocation, Error, EvmStreamRevocation, EvmStreamRevocationQueryKey>
