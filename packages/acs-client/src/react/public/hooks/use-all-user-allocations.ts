"use client"
import { useQuery } from "@tanstack/react-query"
import {
  allUserAllocationsQueryOptions,
  type AllUserAllocationsQueryKey,
} from "../../../query/public/all-user-allocations"
import type { Allocation } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { usePublicClient } from "../../use-acs-config"

export type UseAllUserAllocationsParameters<TData = Allocation[]> = {
  address: string | undefined
  isBoundAddress?: boolean
  /** Gated-app only (Slice 05). Non-gated apps leave these unset. */
  sig?: string
  deploymentId?: string
} & QueryParameter<Allocation[], Error, TData, AllUserAllocationsQueryKey>

/**
 * App-wide variant of `useUserAllocations`: fetches the user's allocations
 * across the whole app (no deployment scoping) and returns the flat
 * `Allocation[]`. Used by the portal's portfolio list, which groups rows by
 * deployment via `app_conf`.
 */
export const useAllUserAllocations = <TData = Allocation[]>(
  parameters: UseAllUserAllocationsParameters<TData>,
) => {
  const client = usePublicClient()
  const { query, ...params } = parameters
  return useQuery({
    ...allUserAllocationsQueryOptions(client, params),
    ...query,
  })
}
