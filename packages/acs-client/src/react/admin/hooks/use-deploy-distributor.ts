"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  deployDistributorMutationOptions,
  type DeployDistributorData,
} from "../../../query/admin/relay/deploy-distributor"
import { acsKeys } from "../../../query/keys"
import type { DeployDistributorParams } from "../../../actions/admin/relay/deploy-distributor"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseDeployDistributorParameters<TContext = unknown> = MutationParameter<
  DeployDistributorData,
  Error,
  DeployDistributorParams,
  TContext
>

export const useDeployDistributor = <TContext = unknown>(
  parameters: UseDeployDistributorParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const queryClient = useQueryClient()
  const { mutation } = parameters
  return useMutation({
    ...deployDistributorMutationOptions(client),
    ...mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: acsKeys.admin.appConf(client.appId ?? ""),
      })
      return mutation?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
