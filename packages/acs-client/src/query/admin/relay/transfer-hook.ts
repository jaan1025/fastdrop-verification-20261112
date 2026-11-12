import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../../transport"
import {
  deployTransferHook,
  type DeployTransferHookParams,
} from "../../../actions/admin/relay/transfer-hook"
import { acsKeys } from "../../keys"

export type DeployTransferHookData = Awaited<ReturnType<typeof deployTransferHook>>

export const deployTransferHookMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: DeployTransferHookParams) => deployTransferHook(client, variables),
    mutationKey: [...acsKeys.admin.all(), "deployTransferHook"] as const,
  }) satisfies UseMutationOptions<DeployTransferHookData, Error, DeployTransferHookParams>
