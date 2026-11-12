"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createAppConfMutationOptions, type CreateAppConfData } from "../../../query/admin/app-conf"
import { acsKeys } from "../../../query/keys"
import type { CreateAppConfParams } from "../../../actions/admin/app-conf"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseCreateAppConfParameters<TContext = unknown> = MutationParameter<
  CreateAppConfData,
  Error,
  CreateAppConfParams,
  TContext
>

export const useCreateAppConf = <TContext = unknown>(
  parameters: UseCreateAppConfParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const queryClient = useQueryClient()
  const { mutation } = parameters
  return useMutation({
    ...createAppConfMutationOptions(client),
    ...mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      // The new org shows up in the caller's `/inspect` scopes once the backend
      // grants it; drop the cached inspect so the org list refetches.
      queryClient.invalidateQueries({ queryKey: acsKeys.public.all() })
      return mutation?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
