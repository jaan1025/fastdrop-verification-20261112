"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmSingleTierFeeRateQueryOptions,
  type UseSingleTierFeeRateParameters,
} from "../../../query/distributor/single-tier-fee-rate"

export const useSingleTierFeeRate = (parameters: UseSingleTierFeeRateParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmSingleTierFeeRateQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
