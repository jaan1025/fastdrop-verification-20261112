"use client"
import { useMutation } from "@tanstack/react-query"
import {
  setPenaltyConfigMutationOptions,
  type SetPenaltyConfigData,
} from "../../../query/admin/relay/penalty-hook"
import type { SetPenaltyConfigParams } from "../../../actions/admin/relay/penalty-hook"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseSetPenaltyConfigParameters<TContext = unknown> = MutationParameter<
  SetPenaltyConfigData,
  Error,
  SetPenaltyConfigParams,
  TContext
>

export const useSetPenaltyConfig = <TContext = unknown>(
  parameters: UseSetPenaltyConfigParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...setPenaltyConfigMutationOptions(client),
    ...mutation,
  })
}
