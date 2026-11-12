import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type Hash, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getStreamPreset } from "../../../../contracts/distributor/strategies/lock-hook/functions"
import { airdropEvmKeys } from "../../../keys"

type StreamPresetInputs = {
  lockHook: Address | undefined
  distributor: Address | undefined
  configurationId: Hash | undefined
}

export type EvmStreamPresetData = Awaited<ReturnType<typeof getStreamPreset>>
export type EvmStreamPresetQueryKey = ReturnType<typeof airdropEvmKeys.streamPreset>

export const evmStreamPresetQueryOptions = (
  params: StreamPresetInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, lockHook, distributor, configurationId, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.streamPreset({
      chainId,
      lockHook,
      distributor,
      configurationId,
    }),
    queryFn:
      publicClient && lockHook && distributor && configurationId
        ? () =>
            getStreamPreset(publicClient, {
              lockHook,
              distributor,
              configurationId,
            })
        : skipToken,
  })
}

export type UseStreamPresetParameters = StreamPresetInputs & {
  chainId: number
} & QueryParameter<EvmStreamPresetData, Error, EvmStreamPresetData, EvmStreamPresetQueryKey>
