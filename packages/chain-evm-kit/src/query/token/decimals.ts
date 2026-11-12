import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { getDecimals } from "../../token/functions"
import { evmKeys } from "../keys"

type TokenInputs = { token: Address | undefined }

export type EvmTokenDecimalsData = Awaited<ReturnType<typeof getDecimals>>
export type EvmTokenDecimalsQueryKey = ReturnType<typeof evmKeys.erc20.decimals>

export const evmTokenDecimalsQueryOptions = (
  params: TokenInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, token, publicClient } = params
  return queryOptions({
    queryKey: evmKeys.erc20.decimals({ chainId, token }),
    queryFn: publicClient && token ? () => getDecimals(publicClient, { token }) : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
