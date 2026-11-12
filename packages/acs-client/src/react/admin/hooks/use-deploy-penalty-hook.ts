"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  deployPenaltyHookMutationOptions,
  type DeployPenaltyHookData,
} from "../../../query/admin/relay/penalty-hook"
import { acsKeys } from "../../../query/keys"
import type { DeployPenaltyHookParams } from "../../../actions/admin/relay/penalty-hook"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseDeployPenaltyHookParameters<TContext = unknown> = MutationParameter<
  DeployPenaltyHookData,
  Error,
  DeployPenaltyHookParams,
  TContext
>

export const useDeployPenaltyHook = <TContext = unknown>(
  parameters: UseDeployPenaltyHookParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const queryClient = useQueryClient()
  const { mutation } = parameters
  return useMutation({
    ...deployPenaltyHookMutationOptions(client),
    ...mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: acsKeys.admin.appConf(client.appId ?? ""),
      })
      return mutation?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
