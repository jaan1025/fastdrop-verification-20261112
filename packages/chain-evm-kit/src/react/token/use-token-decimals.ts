"use client"
import { useQuery } from "@tanstack/react-query"
import { type Address } from "viem"
import { usePublicClient } from "wagmi"
import type { QueryParameter } from "@repo/acs-client/react"
import {
  evmTokenDecimalsQueryOptions,
  type EvmTokenDecimalsData,
  type EvmTokenDecimalsQueryKey,
} from "../../query/token/decimals"

type TokenInputs = { token: Address | undefined }

export type UseTokenDecimalsParameters = TokenInputs & {
  chainId: number
} & QueryParameter<EvmTokenDecimalsData, Error, EvmTokenDecimalsData, EvmTokenDecimalsQueryKey>
export const useTokenDecimals = (parameters: UseTokenDecimalsParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmTokenDecimalsQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
