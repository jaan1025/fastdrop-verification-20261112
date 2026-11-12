import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getActive } from "../../contracts/distributor/functions"
import { airdropEvmKeys } from "../keys"

type DistributorInputs = { distributor: Address | undefined }

export type EvmActiveData = Awaited<ReturnType<typeof getActive>>
export type EvmActiveQueryKey = ReturnType<typeof airdropEvmKeys.active>

export const evmActiveQueryOptions = (
  params: DistributorInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, distributor, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.active({ chainId, distributor }),
    queryFn:
      publicClient && distributor ? () => getActive(publicClient, { distributor }) : skipToken,
  })
}

export type UseActiveParameters = DistributorInputs & { chainId: number } & QueryParameter<
    EvmActiveData,
    Error,
    EvmActiveData,
    EvmActiveQueryKey
  >
