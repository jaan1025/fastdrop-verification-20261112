"use client"
import { useMutation } from "@tanstack/react-query"
import { setHookMutationOptions, type SetHookData } from "../../../query/admin/relay/set-hook"
import type { SetHookParams } from "../../../actions/admin/relay/set-hook"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseSetHookParameters<TContext = unknown> = MutationParameter<
  SetHookData,
  Error,
  SetHookParams,
  TContext
>

export const useSetHook = <TContext = unknown>(parameters: UseSetHookParameters<TContext> = {}) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...setHookMutationOptions(client),
    ...mutation,
  })
}
