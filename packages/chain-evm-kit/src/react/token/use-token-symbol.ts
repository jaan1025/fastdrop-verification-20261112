"use client"
import { useQuery } from "@tanstack/react-query"
import { type Address } from "viem"
import { usePublicClient } from "wagmi"
import type { QueryParameter } from "@repo/acs-client/react"
import {
  evmTokenSymbolQueryOptions,
  type EvmTokenSymbolData,
  type EvmTokenSymbolQueryKey,
} from "../../query/token/symbol"

type TokenInputs = { token: Address | undefined }

export type UseTokenSymbolParameters = TokenInputs & { chainId: number } & QueryParameter<
    EvmTokenSymbolData,
    Error,
    EvmTokenSymbolData,
    EvmTokenSymbolQueryKey
  >
export const useTokenSymbol = (parameters: UseTokenSymbolParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmTokenSymbolQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
