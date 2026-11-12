"use client"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { Stream } from "../../../contracts/lock/functions"
import {
  solanaClaimableAmountQueryOptions,
  type SolanaClaimableAmountData,
  type SolanaClaimableAmountQueryKey,
} from "../../../query/lock"

export type UseClaimableAmountParameters = {
  stream: Stream | null | undefined
} & QueryParameter<
  SolanaClaimableAmountData,
  Error,
  SolanaClaimableAmountData,
  SolanaClaimableAmountQueryKey
>

export const useClaimableAmount = (parameters: UseClaimableAmountParameters) => {
  const { query, ...params } = parameters
  return useQuery({
    ...solanaClaimableAmountQueryOptions(params),
    ...query,
  })
}
