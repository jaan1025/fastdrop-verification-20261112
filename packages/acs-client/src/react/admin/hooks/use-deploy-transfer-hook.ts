"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  deployTransferHookMutationOptions,
  type DeployTransferHookData,
} from "../../../query/admin/relay/transfer-hook"
import { acsKeys } from "../../../query/keys"
import type { DeployTransferHookParams } from "../../../actions/admin/relay/transfer-hook"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseDeployTransferHookParameters<TContext = unknown> = MutationParameter<
  DeployTransferHookData,
  Error,
  DeployTransferHookParams,
  TContext
>

export const useDeployTransferHook = <TContext = unknown>(
  parameters: UseDeployTransferHookParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const queryClient = useQueryClient()
  const { mutation } = parameters
  return useMutation({
    ...deployTransferHookMutationOptions(client),
    ...mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: acsKeys.admin.appConf(client.appId ?? ""),
      })
      return mutation?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
