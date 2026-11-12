"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmFixedFeeQueryOptions,
  type UseFixedFeeParameters,
} from "../../../query/distributor/fixed-fee"

export const useFixedFee = (parameters: UseFixedFeeParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmFixedFeeQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
