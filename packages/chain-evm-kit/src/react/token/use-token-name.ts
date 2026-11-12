"use client"
import { useQuery } from "@tanstack/react-query"
import { type Address } from "viem"
import { usePublicClient } from "wagmi"
import type { QueryParameter } from "@repo/acs-client/react"
import {
  evmTokenNameQueryOptions,
  type EvmTokenNameData,
  type EvmTokenNameQueryKey,
} from "../../query/token/name"

type TokenInputs = { token: Address | undefined }

export type UseTokenNameParameters = TokenInputs & { chainId: number } & QueryParameter<
    EvmTokenNameData,
    Error,
    EvmTokenNameData,
    EvmTokenNameQueryKey
  >
export const useTokenName = (parameters: UseTokenNameParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmTokenNameQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
