import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type Hash, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getFeeMode } from "../../contracts/distributor/functions"
import { airdropEvmKeys } from "../keys"

type DistributorRootInputs = {
  distributor: Address | undefined
  root: Hash | undefined
}

export type EvmFeeModeData = Awaited<ReturnType<typeof getFeeMode>>
export type EvmFeeModeQueryKey = ReturnType<typeof airdropEvmKeys.feeMode>

export const evmFeeModeQueryOptions = (
  params: DistributorRootInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, distributor, root, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.feeMode({ chainId, distributor, root }),
    queryFn:
      publicClient && distributor && root
        ? () => getFeeMode(publicClient, { distributor, root })
        : skipToken,
  })
}

export type UseFeeModeParameters = DistributorRootInputs & {
  chainId: number
} & QueryParameter<EvmFeeModeData, Error, EvmFeeModeData, EvmFeeModeQueryKey>
