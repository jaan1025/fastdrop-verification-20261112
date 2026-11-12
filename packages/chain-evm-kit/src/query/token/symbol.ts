import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { getSymbol } from "../../token/functions"
import { evmKeys } from "../keys"

type TokenInputs = { token: Address | undefined }

export type EvmTokenSymbolData = Awaited<ReturnType<typeof getSymbol>>
export type EvmTokenSymbolQueryKey = ReturnType<typeof evmKeys.erc20.symbol>

export const evmTokenSymbolQueryOptions = (
  params: TokenInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, token, publicClient } = params
  return queryOptions({
    queryKey: evmKeys.erc20.symbol({ chainId, token }),
    queryFn: publicClient && token ? () => getSymbol(publicClient, { token }) : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
