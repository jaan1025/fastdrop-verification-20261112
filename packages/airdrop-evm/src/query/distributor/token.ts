import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getToken } from "../../contracts/distributor/functions"
import { airdropEvmKeys } from "../keys"

type DistributorInputs = { distributor: Address | undefined }

export type EvmTokenData = Awaited<ReturnType<typeof getToken>>
export type EvmTokenQueryKey = ReturnType<typeof airdropEvmKeys.token>

export const evmTokenQueryOptions = (
  params: DistributorInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, distributor, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.token({ chainId, distributor }),
    queryFn:
      publicClient && distributor ? () => getToken(publicClient, { distributor }) : skipToken,
  })
}

export type UseTokenParameters = DistributorInputs & { chainId: number } & QueryParameter<
    EvmTokenData,
    Error,
    EvmTokenData,
    EvmTokenQueryKey
  >
