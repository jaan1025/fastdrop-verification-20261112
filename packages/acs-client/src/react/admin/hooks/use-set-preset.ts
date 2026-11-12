"use client"
import { useMutation } from "@tanstack/react-query"
import { setPresetMutationOptions, type SetPresetData } from "../../../query/admin/relay/lock-hook"
import type { SetPresetParams } from "../../../actions/admin/relay/lock-hook"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseSetPresetParameters<TContext = unknown> = MutationParameter<
  SetPresetData,
  Error,
  SetPresetParams,
  TContext
>

export const useSetPreset = <TContext = unknown>(
  parameters: UseSetPresetParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...setPresetMutationOptions(client),
    ...mutation,
  })
}
