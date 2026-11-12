"use client"
import { useQuery } from "@tanstack/react-query"
import {
  userAllocationsQueryOptions,
  type UserAllocations,
  type UserAllocationsQueryKey,
} from "../../../query/public/user-allocations"
import type { Allocation } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { usePublicClient } from "../../use-acs-config"

export type UseUserAllocationParameters<TData = Allocation | undefined> = {
  batch: string | undefined
  address: string | undefined
  isBoundAddress?: boolean
  sig?: string
  deploymentId?: string
} & QueryParameter<UserAllocations, Error, TData, UserAllocationsQueryKey>

export const useUserAllocation = <TData = Allocation | undefined>(
  parameters: UseUserAllocationParameters<TData>,
) => {
  const client = usePublicClient()
  const { batch, query, ...rest } = parameters
  return useQuery({
    ...userAllocationsQueryOptions(client, rest),
    // Inline select returns `Allocation | undefined`; cast to TData so callers
    // who don't override `query.select` get that as the default `TData`.
    // If the caller passes their own `query.select`, the trailing `...query`
    // spread replaces this one and TData is inferred from theirs.
    select: ((data: UserAllocations) => (batch ? data.byBatch[batch] : undefined)) as (
      data: UserAllocations,
    ) => TData,
    ...query,
  })
}
