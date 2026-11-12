import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../../transport"
import {
  deployLockHook,
  setPreset,
  type DeployLockHookParams,
  type SetPresetParams,
} from "../../../actions/admin/relay/lock-hook"
import { acsKeys } from "../../keys"

export type DeployLockHookData = Awaited<ReturnType<typeof deployLockHook>>
export type SetPresetData = Awaited<ReturnType<typeof setPreset>>

export const deployLockHookMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: DeployLockHookParams) => deployLockHook(client, variables),
    mutationKey: [...acsKeys.admin.all(), "deployLockHook"] as const,
  }) satisfies UseMutationOptions<DeployLockHookData, Error, DeployLockHookParams>

export const setPresetMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: SetPresetParams) => setPreset(client, variables),
    mutationKey: [...acsKeys.admin.all(), "setPreset"] as const,
  }) satisfies UseMutationOptions<SetPresetData, Error, SetPresetParams>
