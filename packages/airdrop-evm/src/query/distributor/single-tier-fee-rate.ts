import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type Hash, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getSingleTierFeeRate } from "../../contracts/distributor/functions"
import { airdropEvmKeys } from "../keys"

type DistributorRootInputs = {
  distributor: Address | undefined
  root: Hash | undefined
}

export type EvmSingleTierFeeRateData = Awaited<ReturnType<typeof getSingleTierFeeRate>>
export type EvmSingleTierFeeRateQueryKey = ReturnType<typeof airdropEvmKeys.singleTierFeeRate>

export const evmSingleTierFeeRateQueryOptions = (
  params: DistributorRootInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, distributor, root, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.singleTierFeeRate({ chainId, distributor, root }),
    queryFn:
      publicClient && distributor && root
        ? () => getSingleTierFeeRate(publicClient, { distributor, root })
        : skipToken,
  })
}

export type UseSingleTierFeeRateParameters = DistributorRootInputs & {
  chainId: number
} & QueryParameter<
    EvmSingleTierFeeRateData,
    Error,
    EvmSingleTierFeeRateData,
    EvmSingleTierFeeRateQueryKey
  >
