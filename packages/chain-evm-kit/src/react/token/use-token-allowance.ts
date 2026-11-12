"use client"
import { useQuery } from "@tanstack/react-query"
import { type Address } from "viem"
import { usePublicClient } from "wagmi"
import type { QueryParameter } from "@repo/acs-client/react"
import {
  evmTokenAllowanceQueryOptions,
  type EvmTokenAllowanceData,
  type EvmTokenAllowanceQueryKey,
} from "../../query/token/allowance"

type TokenInputs = { token: Address | undefined }
type AllowanceInputs = TokenInputs & {
  owner: Address | undefined
  spender: Address | undefined
}

export type UseTokenAllowanceParameters = AllowanceInputs & {
  chainId: number
} & QueryParameter<EvmTokenAllowanceData, Error, EvmTokenAllowanceData, EvmTokenAllowanceQueryKey>
export const useTokenAllowance = (parameters: UseTokenAllowanceParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmTokenAllowanceQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
