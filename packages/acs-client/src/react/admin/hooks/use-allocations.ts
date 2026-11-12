"use client"
import { useQuery } from "@tanstack/react-query"
import {
  allocationsQueryOptions,
  type AdminAllocationsQueryKey,
} from "../../../query/admin/allocations"
import type { AllocationQueryParams, AllocationResponse } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseAllocationsParameters<TData = AllocationResponse> = AllocationQueryParams &
  QueryParameter<AllocationResponse, Error, TData, AdminAllocationsQueryKey>

export const useAllocations = <TData = AllocationResponse>(
  parameters: UseAllocationsParameters<TData>,
) => {
  const client = useAdminClient()
  const { query, ...params } = parameters
  return useQuery({
    ...allocationsQueryOptions(client, params as AllocationQueryParams),
    ...query,
  })
}
