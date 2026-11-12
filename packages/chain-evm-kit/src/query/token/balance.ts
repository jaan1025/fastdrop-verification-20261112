import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { getBalance } from "../../token/functions"
import { evmKeys } from "../keys"

type TokenInputs = { token: Address | undefined }
type BalanceInputs = TokenInputs & { account: Address | undefined }

export type EvmTokenBalanceData = Awaited<ReturnType<typeof getBalance>>
export type EvmTokenBalanceQueryKey = ReturnType<typeof evmKeys.erc20.balance>

export const evmTokenBalanceQueryOptions = (
  params: BalanceInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, token, account, publicClient } = params
  return queryOptions({
    queryKey: evmKeys.erc20.balance({ chainId, token, account }),
    queryFn:
      publicClient && token && account
        ? () => getBalance(publicClient, { token, account })
        : skipToken,
  })
}
