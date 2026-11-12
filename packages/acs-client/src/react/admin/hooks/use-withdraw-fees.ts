"use client"
import { useMutation } from "@tanstack/react-query"
import {
  withdrawFeesMutationOptions,
  type WithdrawFeesData,
} from "../../../query/admin/relay/withdraw"
import type { WithdrawFeesParams } from "../../../actions/admin/relay/withdraw"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseWithdrawFeesParameters<TContext = unknown> = MutationParameter<
  WithdrawFeesData,
  Error,
  WithdrawFeesParams,
  TContext
>

export const useWithdrawFees = <TContext = unknown>(
  parameters: UseWithdrawFeesParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...withdrawFeesMutationOptions(client),
    ...mutation,
  })
}
