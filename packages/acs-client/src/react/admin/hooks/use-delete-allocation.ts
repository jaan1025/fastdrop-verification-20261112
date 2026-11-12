"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteAllocationMutationOptions } from "../../../query/admin/allocations"
import { acsKeys } from "../../../query/keys"
import type { DeleteAllocationParams } from "../../../actions/admin/allocations"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseDeleteAllocationParameters<TContext = unknown> = MutationParameter<
  void,
  Error,
  DeleteAllocationParams,
  TContext
>

export const useDeleteAllocation = <TContext = unknown>(
  parameters: UseDeleteAllocationParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const queryClient = useQueryClient()
  const { mutation } = parameters
  return useMutation({
    ...deleteAllocationMutationOptions(client),
    ...mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Allocation rows + per-batch stats are the only admin caches affected.
      queryClient.invalidateQueries({
        queryKey: acsKeys.admin.allAllocations(),
      })
      queryClient.invalidateQueries({
        queryKey: acsKeys.admin.batchStats(client.appId ?? ""),
      })
      return mutation?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
