"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmClaimableAmountQueryOptions,
  type UseClaimableAmountParameters,
} from "../../../query/lock"

export const useClaimableAmount = (parameters: UseClaimableAmountParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmClaimableAmountQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
