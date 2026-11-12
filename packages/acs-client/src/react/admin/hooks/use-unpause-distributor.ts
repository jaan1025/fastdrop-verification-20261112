"use client"
import { useMutation } from "@tanstack/react-query"
import {
  unpauseDistributorMutationOptions,
  type PauseDistributorData,
} from "../../../query/admin/relay/pause"
import type { PauseDistributorParams } from "../../../actions/admin/relay/pause"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseUnpauseDistributorParameters<TContext = unknown> = MutationParameter<
  PauseDistributorData,
  Error,
  PauseDistributorParams,
  TContext
>

export const useUnpauseDistributor = <TContext = unknown>(
  parameters: UseUnpauseDistributorParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...unpauseDistributorMutationOptions(client),
    ...mutation,
  })
}
