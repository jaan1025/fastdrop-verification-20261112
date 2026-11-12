"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmDynamicRecipientQueryOptions,
  type UseDynamicRecipientParameters,
} from "../../../query/distributor/dynamic-recipient"

export const useDynamicRecipient = (parameters: UseDynamicRecipientParameters) => {
  const { query, ...inputs } = parameters
  const publicClient = usePublicClient({ chainId: inputs.chainId })
  return useQuery({
    ...evmDynamicRecipientQueryOptions({ ...inputs, publicClient }),
    ...query,
  })
}
