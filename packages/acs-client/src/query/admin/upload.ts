import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { uploadAllocation, type UploadAllocationParams } from "../../actions/admin/upload"
import { acsKeys } from "../keys"

export type UploadAllocationData = Awaited<ReturnType<typeof uploadAllocation>>

export const uploadAllocationMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: UploadAllocationParams) => uploadAllocation(client, variables),
    mutationKey: [...acsKeys.admin.all(), "uploadAllocation"] as const,
  }) satisfies UseMutationOptions<UploadAllocationData, Error, UploadAllocationParams>
