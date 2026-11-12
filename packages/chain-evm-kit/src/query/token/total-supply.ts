import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { getTotalSupply } from "../../token/functions"
import { evmKeys } from "../keys"

type TokenInputs = { token: Address | undefined }

export type EvmTotalSupplyData = Awaited<ReturnType<typeof getTotalSupply>>
export type EvmTotalSupplyQueryKey = ReturnType<typeof evmKeys.erc20.totalSupply>

export const evmTotalSupplyQueryOptions = (
  params: TokenInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, token, publicClient } = params
  return queryOptions({
    queryKey: evmKeys.erc20.totalSupply({ chainId, token }),
    queryFn: publicClient && token ? () => getTotalSupply(publicClient, { token }) : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
