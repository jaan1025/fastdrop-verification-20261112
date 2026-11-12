"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  uploadAllocationMutationOptions,
  type UploadAllocationData,
} from "../../../query/admin/upload"
import { acsKeys } from "../../../query/keys"
import type { UploadAllocationParams } from "../../../actions/admin/upload"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseUploadAllocationParameters<TContext = unknown> = MutationParameter<
  UploadAllocationData,
  Error,
  UploadAllocationParams,
  TContext
>

export const useUploadAllocation = <TContext = unknown>(
  parameters: UseUploadAllocationParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const queryClient = useQueryClient()
  const { mutation } = parameters
  return useMutation({
    ...uploadAllocationMutationOptions(client),
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
