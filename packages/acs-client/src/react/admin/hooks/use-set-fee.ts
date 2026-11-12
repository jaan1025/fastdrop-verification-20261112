"use client"
import { useMutation } from "@tanstack/react-query"
import { setFeeMutationOptions, type SetFeeData } from "../../../query/admin/relay/set-fee"
import type { SetFeeParams } from "../../../actions/admin/relay/set-fee"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseSetFeeParameters<TContext = unknown> = MutationParameter<
  SetFeeData,
  Error,
  SetFeeParams,
  TContext
>

export const useSetFee = <TContext = unknown>(parameters: UseSetFeeParameters<TContext> = {}) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...setFeeMutationOptions(client),
    ...mutation,
  })
}
