"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createRelayerMutationOptions, type CreateRelayerData } from "../../../query/admin/relayer"
import { acsKeys } from "../../../query/keys"
import type { CreateRelayerParams } from "../../../actions/admin/relayer"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseCreateRelayerParameters<TContext = unknown> = MutationParameter<
  CreateRelayerData,
  Error,
  CreateRelayerParams,
  TContext
>

export const useCreateRelayer = <TContext = unknown>(
  parameters: UseCreateRelayerParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const queryClient = useQueryClient()
  const { mutation } = parameters
  return useMutation({
    ...createRelayerMutationOptions(client),
    ...mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: acsKeys.admin.relayers(client.appId ?? ""),
      })
      return mutation?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
