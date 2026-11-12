"use client"
import { useQuery } from "@tanstack/react-query"
import { type Address } from "viem"
import { usePublicClient } from "wagmi"
import type { QueryParameter } from "@repo/acs-client/react"
import {
  evmTotalSupplyQueryOptions,
  type EvmTotalSupplyData,
  type EvmTotalSupplyQueryKey,
} from "../../query/token/total-supply"

type TokenInputs = { token: Address | undefined }

export type UseTotalSupplyParameters = TokenInputs & { chainId: number } & QueryParameter<
    EvmTotalSupplyData,
    Error,
    EvmTotalSupplyData,
    EvmTotalSupplyQueryKey
  >
export const useTotalSupply = (parameters: UseTotalSupplyParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmTotalSupplyQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
