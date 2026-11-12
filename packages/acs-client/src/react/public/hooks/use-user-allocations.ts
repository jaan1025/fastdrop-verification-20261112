"use client"
import { useQuery } from "@tanstack/react-query"
import {
  userAllocationsQueryOptions,
  type UserAllocations,
  type UserAllocationsQueryKey,
} from "../../../query/public/user-allocations"
import type { QueryParameter } from "../../types/query-parameter"
import { usePublicClient } from "../../use-acs-config"

export type UseUserAllocationsParameters<TData = UserAllocations> = {
  address: string | undefined
  isBoundAddress?: boolean
  sig?: string
  /** Override the client's deploymentId for this call. */
  deploymentId?: string
} & QueryParameter<UserAllocations, Error, TData, UserAllocationsQueryKey>

export const useUserAllocations = <TData = UserAllocations>(
  parameters: UseUserAllocationsParameters<TData>,
) => {
  const client = usePublicClient()
  const { query, ...params } = parameters
  return useQuery({
    ...userAllocationsQueryOptions(client, params),
    ...query,
  })
}
