"use client"
import { useQuery } from "@tanstack/react-query"
import { type Address } from "viem"
import { usePublicClient } from "wagmi"
import type { QueryParameter } from "@repo/acs-client/react"
import {
  evmTokenInfoQueryOptions,
  type EvmTokenInfoData,
  type EvmTokenInfoQueryKey,
} from "../../query/token/info"

export type UseTokenInfoParameters = {
  token: Address | undefined
  chainId: number
} & QueryParameter<EvmTokenInfoData, Error, EvmTokenInfoData, EvmTokenInfoQueryKey>

/**
 * Fetches symbol + decimals + name + totalSupply via a `Promise.all` of four
 * separate `readContract` calls (see `getTokenInfo`). viem only collapses these
 * into a single Multicall3 `aggregate3` request when the underlying client has
 * multicall batching enabled (`batch: { multicall: true }`); the default
 * `createPublicClient` does not, so absent that opt-in this issues four
 * concurrent `eth_call` requests.
 */
export const useTokenInfo = (parameters: UseTokenInfoParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmTokenInfoQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
