import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../../transport"
import { withdrawFees, type WithdrawFeesParams } from "../../../actions/admin/relay/withdraw"
import { acsKeys } from "../../keys"

export type WithdrawFeesData = Awaited<ReturnType<typeof withdrawFees>>

export const withdrawFeesMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: WithdrawFeesParams) => withdrawFees(client, variables),
    mutationKey: [...acsKeys.admin.all(), "withdrawFees"] as const,
  }) satisfies UseMutationOptions<WithdrawFeesData, Error, WithdrawFeesParams>
