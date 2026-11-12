"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmTransferCapQueryOptions,
  type UseTransferCapParameters,
} from "../../../../../query/distributor/strategies/transfer-with-cap-hook"

export const useTransferCap = (parameters: UseTransferCapParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmTransferCapQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
