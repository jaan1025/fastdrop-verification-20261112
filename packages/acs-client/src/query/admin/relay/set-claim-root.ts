import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../../transport"
import { setClaimRoot, type SetClaimRootParams } from "../../../actions/admin/relay/set-claim-root"
import { acsKeys } from "../../keys"

export type SetClaimRootData = Awaited<ReturnType<typeof setClaimRoot>>

export const setClaimRootMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: SetClaimRootParams) => setClaimRoot(client, variables),
    mutationKey: [...acsKeys.admin.all(), "setClaimRoot"] as const,
  }) satisfies UseMutationOptions<SetClaimRootData, Error, SetClaimRootParams>
