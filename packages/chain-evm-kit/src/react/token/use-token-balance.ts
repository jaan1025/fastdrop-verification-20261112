"use client"
import { useQuery } from "@tanstack/react-query"
import { type Address } from "viem"
import { usePublicClient } from "wagmi"
import type { QueryParameter } from "@repo/acs-client/react"
import {
  evmTokenBalanceQueryOptions,
  type EvmTokenBalanceData,
  type EvmTokenBalanceQueryKey,
} from "../../query/token/balance"

type TokenInputs = { token: Address | undefined }
type BalanceInputs = TokenInputs & { account: Address | undefined }

export type UseTokenBalanceParameters = BalanceInputs & {
  chainId: number
} & QueryParameter<EvmTokenBalanceData, Error, EvmTokenBalanceData, EvmTokenBalanceQueryKey>
export const useTokenBalance = (parameters: UseTokenBalanceParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmTokenBalanceQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
