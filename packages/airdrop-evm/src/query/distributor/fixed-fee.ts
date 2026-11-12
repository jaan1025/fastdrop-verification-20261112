import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type Hash, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getFixedFee } from "../../contracts/distributor/functions"
import { airdropEvmKeys } from "../keys"

type DistributorRootInputs = {
  distributor: Address | undefined
  root: Hash | undefined
}

export type EvmFixedFeeData = Awaited<ReturnType<typeof getFixedFee>>
export type EvmFixedFeeQueryKey = ReturnType<typeof airdropEvmKeys.fixedFee>

export const evmFixedFeeQueryOptions = (
  params: DistributorRootInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, distributor, root, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.fixedFee({ chainId, distributor, root }),
    queryFn:
      publicClient && distributor && root
        ? () => getFixedFee(publicClient, { distributor, root })
        : skipToken,
  })
}

export type UseFixedFeeParameters = DistributorRootInputs & {
  chainId: number
} & QueryParameter<EvmFixedFeeData, Error, EvmFixedFeeData, EvmFixedFeeQueryKey>
