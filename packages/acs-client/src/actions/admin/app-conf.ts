import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import type { AppConf, JsonPatchOp } from "../../model"

export const getAppConf = (client: AcsClient) =>
  client.request<AppConf>(`/admin/app_conf/${requireAppId(client, "getAppConf")}`)

export interface PatchAppConfParams {
  ops: JsonPatchOp[]
  migrationVersion: number
}

export const patchAppConf = (client: AcsClient, params: PatchAppConfParams) =>
  client.request<AppConf>(`/admin/app_conf/${requireAppId(client, "patchAppConf")}`, {
    method: "PATCH",
    body: { migrationVersion: params.migrationVersion, ops: params.ops },
  })

/**
 * Create a brand-new org (app_conf). The `appId` is the org being created — it
 * is taken from `params` (NOT `client.appId`), since no scoped client exists for
 * an org that doesn't yet exist. Only a super-admin token is authorized server-
 * side. Starts with no deployments; ToS / partial-claim config is optional.
 */
export interface CreateAppConfParams {
  appId: string
  displayName: string
  tosMessage?: string
  tosTemplate?: string
  partialClaim?: { url: string; responseMapping: string }
}

export const createAppConf = (client: AcsClient, params: CreateAppConfParams) =>
  client.request<AppConf>(`/admin/app_conf/${params.appId}`, {
    method: "POST",
    body: {
      appId: params.appId,
      extra: {
        displayName: params.displayName,
        ...(params.tosMessage ? { tosMessage: params.tosMessage } : {}),
        ...(params.tosTemplate ? { tosTemplate: params.tosTemplate } : {}),
        ...(params.partialClaim ? { partialClaim: params.partialClaim } : {}),
      },
      deployments: {},
      gated: false,
      uniqueDevice: false,
      migrationVersion: 0,
    },
  })
