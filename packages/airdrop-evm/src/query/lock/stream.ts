import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getStream } from "../../contracts/lock/functions"
import { airdropEvmKeys } from "../keys"

type StreamInputs = {
  lock: Address | undefined
  streamId: bigint | undefined
}

export type EvmStreamData = Awaited<ReturnType<typeof getStream>>
export type EvmStreamQueryKey = ReturnType<typeof airdropEvmKeys.stream>

export const evmStreamQueryOptions = (
  params: StreamInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, lock, streamId, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.stream({
      chainId,
      lock,
      streamId: streamId !== undefined ? String(streamId) : undefined,
    }),
    queryFn:
      publicClient && lock && streamId !== undefined
        ? () => getStream(publicClient, { lock, streamId })
        : skipToken,
  })
}

export type UseStreamParameters = StreamInputs & { chainId: number } & QueryParameter<
    EvmStreamData,
    Error,
    EvmStreamData,
    EvmStreamQueryKey
  >
