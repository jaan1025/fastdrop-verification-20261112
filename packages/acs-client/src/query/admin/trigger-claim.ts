import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { triggerClaim, type TriggerClaimParams } from "../../actions/admin/trigger-claim"
import { acsKeys } from "../keys"

export type TriggerClaimData = Awaited<ReturnType<typeof triggerClaim>>

export const triggerClaimMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: TriggerClaimParams) => triggerClaim(client, variables),
    mutationKey: [...acsKeys.admin.all(), "triggerClaim"] as const,
  }) satisfies UseMutationOptions<TriggerClaimData, Error, TriggerClaimParams>
