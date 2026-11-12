import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { getTokenInfo, type TokenInfo } from "../../token/functions"
import { evmKeys } from "../keys"

export type { TokenInfo }

export type EvmTokenInfoData = TokenInfo
export type EvmTokenInfoQueryKey = ReturnType<typeof evmKeys.erc20.info>

export const evmTokenInfoQueryOptions = (
  params: { token: Address | undefined } & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, token, publicClient } = params
  return queryOptions({
    queryKey: evmKeys.erc20.info({ chainId, token }),
    queryFn: publicClient && token ? () => getTokenInfo(publicClient, { token }) : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
