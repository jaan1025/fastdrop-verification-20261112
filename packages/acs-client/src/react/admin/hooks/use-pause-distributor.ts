"use client"
import { useMutation } from "@tanstack/react-query"
import {
  pauseDistributorMutationOptions,
  type PauseDistributorData,
} from "../../../query/admin/relay/pause"
import type { PauseDistributorParams } from "../../../actions/admin/relay/pause"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UsePauseDistributorParameters<TContext = unknown> = MutationParameter<
  PauseDistributorData,
  Error,
  PauseDistributorParams,
  TContext
>

export const usePauseDistributor = <TContext = unknown>(
  parameters: UsePauseDistributorParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...pauseDistributorMutationOptions(client),
    ...mutation,
  })
}
