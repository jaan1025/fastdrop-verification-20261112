"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmFeeModeQueryOptions,
  type UseFeeModeParameters,
} from "../../../query/distributor/fee-mode"

export const useFeeMode = (parameters: UseFeeModeParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmFeeModeQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
