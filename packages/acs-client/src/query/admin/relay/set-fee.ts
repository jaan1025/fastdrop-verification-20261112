import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../../transport"
import { setFee, type SetFeeParams } from "../../../actions/admin/relay/set-fee"
import { acsKeys } from "../../keys"

export type SetFeeData = Awaited<ReturnType<typeof setFee>>

export const setFeeMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: SetFeeParams) => setFee(client, variables),
    mutationKey: [...acsKeys.admin.all(), "setFee"] as const,
  }) satisfies UseMutationOptions<SetFeeData, Error, SetFeeParams>
