import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { getAllowance } from "../../token/functions"
import { evmKeys } from "../keys"

type TokenInputs = { token: Address | undefined }
type AllowanceInputs = TokenInputs & {
  owner: Address | undefined
  spender: Address | undefined
}

export type EvmTokenAllowanceData = Awaited<ReturnType<typeof getAllowance>>
export type EvmTokenAllowanceQueryKey = ReturnType<typeof evmKeys.erc20.allowance>

export const evmTokenAllowanceQueryOptions = (
  params: AllowanceInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, token, owner, spender, publicClient } = params
  return queryOptions({
    queryKey: evmKeys.erc20.allowance({ chainId, token, owner, spender }),
    queryFn:
      publicClient && token && owner && spender
        ? () => getAllowance(publicClient, { token, owner, spender })
        : skipToken,
  })
}
