import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { getName } from "../../token/functions"
import { evmKeys } from "../keys"

type TokenInputs = { token: Address | undefined }

export type EvmTokenNameData = Awaited<ReturnType<typeof getName>>
export type EvmTokenNameQueryKey = ReturnType<typeof evmKeys.erc20.name>

export const evmTokenNameQueryOptions = (
  params: TokenInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, token, publicClient } = params
  return queryOptions({
    queryKey: evmKeys.erc20.name({ chainId, token }),
    queryFn: publicClient && token ? () => getName(publicClient, { token }) : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
