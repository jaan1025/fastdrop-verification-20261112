import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type Hash, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getStreamId } from "../../../../contracts/distributor/strategies/lock-hook/functions"
import { airdropEvmKeys } from "../../../keys"

type StreamIdInputs = {
  lockHook: Address | undefined
  distributor: Address | undefined
  root: Hash | undefined
  recipient: Address | undefined
}

export type EvmStreamIdData = Awaited<ReturnType<typeof getStreamId>>
export type EvmStreamIdQueryKey = ReturnType<typeof airdropEvmKeys.streamId>

export const evmStreamIdQueryOptions = (
  params: StreamIdInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, lockHook, distributor, root, recipient, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.streamId({
      chainId,
      lockHook,
      distributor,
      root,
      recipient,
    }),
    queryFn:
      publicClient && lockHook && distributor && root && recipient
        ? () =>
            getStreamId(publicClient, {
              lockHook,
              distributor,
              root,
              recipient,
            })
        : skipToken,
  })
}

export type UseStreamIdParameters = StreamIdInputs & { chainId: number } & QueryParameter<
    EvmStreamIdData,
    Error,
    EvmStreamIdData,
    EvmStreamIdQueryKey
  >
