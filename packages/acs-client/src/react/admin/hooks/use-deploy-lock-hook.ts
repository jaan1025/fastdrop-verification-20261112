"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  deployLockHookMutationOptions,
  type DeployLockHookData,
} from "../../../query/admin/relay/lock-hook"
import { acsKeys } from "../../../query/keys"
import type { DeployLockHookParams } from "../../../actions/admin/relay/lock-hook"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseDeployLockHookParameters<TContext = unknown> = MutationParameter<
  DeployLockHookData,
  Error,
  DeployLockHookParams,
  TContext
>

export const useDeployLockHook = <TContext = unknown>(
  parameters: UseDeployLockHookParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const queryClient = useQueryClient()
  const { mutation } = parameters
  return useMutation({
    ...deployLockHookMutationOptions(client),
    ...mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: acsKeys.admin.appConf(client.appId ?? ""),
      })
      return mutation?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
