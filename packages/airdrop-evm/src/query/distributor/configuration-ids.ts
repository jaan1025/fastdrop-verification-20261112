import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type Hash, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getConfigurationIds } from "../../contracts/distributor/functions"
import { airdropEvmKeys } from "../keys"

type ConfigurationIdsInputs = {
  distributor: Address | undefined
  root: Hash | undefined
}

export type EvmConfigurationIdsData = Awaited<ReturnType<typeof getConfigurationIds>>
export type EvmConfigurationIdsQueryKey = ReturnType<typeof airdropEvmKeys.configurationIds>

export const evmConfigurationIdsQueryOptions = (
  params: ConfigurationIdsInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, distributor, root, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.configurationIds({ chainId, distributor, root }),
    queryFn:
      publicClient && distributor && root
        ? () =>
            getConfigurationIds(publicClient, {
              distributor,
              root,
            })
        : skipToken,
  })
}

export type UseConfigurationIdsParameters = ConfigurationIdsInputs & {
  chainId: number
} & QueryParameter<
    EvmConfigurationIdsData,
    Error,
    EvmConfigurationIdsData,
    EvmConfigurationIdsQueryKey
  >
