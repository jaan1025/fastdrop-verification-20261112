import { skipToken, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import {
  deleteAllocation,
  getAllocations,
  type DeleteAllocationParams,
} from "../../actions/admin/allocations"
import { acsKeys } from "../keys"
import type { AllocationQueryParams, AllocationResponse } from "../../model"
import { withNormalizedAddresses } from "../../model"

export type AdminAllocationsQueryKey = ReturnType<typeof acsKeys.admin.allocations>

const normalizeAllocationParams = (params: AllocationQueryParams): AllocationQueryParams =>
  "cursor" in params ? params : withNormalizedAddresses(params, ["filterAddressHandler"])

export const allocationsQueryOptions = (client: AcsClient, params: AllocationQueryParams) => {
  const normalized = normalizeAllocationParams(params)
  return {
    queryKey: acsKeys.admin.allocations(client.appId ?? "", normalized),
    queryFn: client.appId ? () => getAllocations(client, normalized) : skipToken,
  } satisfies UseQueryOptions<
    AllocationResponse,
    Error,
    AllocationResponse,
    AdminAllocationsQueryKey
  >
}

export const deleteAllocationMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: DeleteAllocationParams) => deleteAllocation(client, variables),
    mutationKey: [...acsKeys.admin.all(), "deleteAllocation"] as const,
  }) satisfies UseMutationOptions<void, Error, DeleteAllocationParams>
