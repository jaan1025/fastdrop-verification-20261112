import { skipToken, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import {
  getAppConf,
  patchAppConf,
  createAppConf,
  type PatchAppConfParams,
  type CreateAppConfParams,
} from "../../actions/admin/app-conf"
import { acsKeys } from "../keys"
import type { AppConf } from "../../model"

export type AdminAppConfQueryKey = ReturnType<typeof acsKeys.admin.appConf>

export const appConfQueryOptions = (client: AcsClient) =>
  ({
    queryKey: acsKeys.admin.appConf(client.appId ?? ""),
    queryFn: client.appId ? () => getAppConf(client) : skipToken,
  }) satisfies UseQueryOptions<AppConf, Error, AppConf, AdminAppConfQueryKey>

export type UpdateAppConfData = Awaited<ReturnType<typeof patchAppConf>>

export const updateAppConfMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: PatchAppConfParams) => patchAppConf(client, variables),
    mutationKey: [...acsKeys.admin.all(), "updateAppConf"] as const,
  }) satisfies UseMutationOptions<UpdateAppConfData, Error, PatchAppConfParams>

export type CreateAppConfData = Awaited<ReturnType<typeof createAppConf>>

export const createAppConfMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: CreateAppConfParams) => createAppConf(client, variables),
    mutationKey: [...acsKeys.admin.all(), "createAppConf"] as const,
  }) satisfies UseMutationOptions<CreateAppConfData, Error, CreateAppConfParams>
