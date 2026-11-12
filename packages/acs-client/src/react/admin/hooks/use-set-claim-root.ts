"use client"
import { useMutation } from "@tanstack/react-query"
import {
  setClaimRootMutationOptions,
  type SetClaimRootData,
} from "../../../query/admin/relay/set-claim-root"
import type { SetClaimRootParams } from "../../../actions/admin/relay/set-claim-root"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseSetClaimRootParameters<TContext = unknown> = MutationParameter<
  SetClaimRootData,
  Error,
  SetClaimRootParams,
  TContext
>

export const useSetClaimRoot = <TContext = unknown>(
  parameters: UseSetClaimRootParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...setClaimRootMutationOptions(client),
    ...mutation,
  })
}
