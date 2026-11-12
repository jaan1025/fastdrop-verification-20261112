"use client"
import { useMutation } from "@tanstack/react-query"
import {
  triggerClaimMutationOptions,
  type TriggerClaimData,
} from "../../../query/admin/trigger-claim"
import type { TriggerClaimParams } from "../../../actions/admin/trigger-claim"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseTriggerClaimParameters<TContext = unknown> = MutationParameter<
  TriggerClaimData,
  Error,
  TriggerClaimParams,
  TContext
>

export const useTriggerClaim = <TContext = unknown>(
  parameters: UseTriggerClaimParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...triggerClaimMutationOptions(client),
    ...mutation,
  })
}
