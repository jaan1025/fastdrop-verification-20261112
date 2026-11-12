"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateAppConfMutationOptions, type UpdateAppConfData } from "../../../query/admin/app-conf"
import { acsKeys } from "../../../query/keys"
import type { PatchAppConfParams } from "../../../actions/admin/app-conf"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseUpdateAppConfParameters<TContext = unknown> = MutationParameter<
  UpdateAppConfData,
  Error,
  PatchAppConfParams,
  TContext
>

export const useUpdateAppConf = <TContext = unknown>(
  parameters: UseUpdateAppConfParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const queryClient = useQueryClient()
  const { mutation } = parameters
  return useMutation({
    ...updateAppConfMutationOptions(client),
    ...mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: acsKeys.admin.appConf(client.appId ?? ""),
      })
      return mutation?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
