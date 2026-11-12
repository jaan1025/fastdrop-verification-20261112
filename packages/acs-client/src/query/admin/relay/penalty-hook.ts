import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../../transport"
import {
  deployPenaltyHook,
  setPenaltyConfig,
  type DeployPenaltyHookParams,
  type SetPenaltyConfigParams,
} from "../../../actions/admin/relay/penalty-hook"
import { acsKeys } from "../../keys"

export type DeployPenaltyHookData = Awaited<ReturnType<typeof deployPenaltyHook>>
export type SetPenaltyConfigData = Awaited<ReturnType<typeof setPenaltyConfig>>

export const deployPenaltyHookMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: DeployPenaltyHookParams) => deployPenaltyHook(client, variables),
    mutationKey: [...acsKeys.admin.all(), "deployPenaltyHook"] as const,
  }) satisfies UseMutationOptions<DeployPenaltyHookData, Error, DeployPenaltyHookParams>

export const setPenaltyConfigMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: SetPenaltyConfigParams) => setPenaltyConfig(client, variables),
    mutationKey: [...acsKeys.admin.all(), "setPenaltyConfig"] as const,
  }) satisfies UseMutationOptions<SetPenaltyConfigData, Error, SetPenaltyConfigParams>
