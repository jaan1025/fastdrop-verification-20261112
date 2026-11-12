import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../../transport"
import { setHook, type SetHookParams } from "../../../actions/admin/relay/set-hook"
import { acsKeys } from "../../keys"

export type SetHookData = Awaited<ReturnType<typeof setHook>>

export const setHookMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: SetHookParams) => setHook(client, variables),
    mutationKey: [...acsKeys.admin.all(), "setHook"] as const,
  }) satisfies UseMutationOptions<SetHookData, Error, SetHookParams>
