import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { authorize, type AuthorizeParams } from "../../actions/admin/auth"
import { acsKeys } from "../keys"

export type AuthorizeData = Awaited<ReturnType<typeof authorize>>

export const authorizeMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: AuthorizeParams) => authorize(client, variables),
    mutationKey: [...acsKeys.admin.all(), "authorize"] as const,
  }) satisfies UseMutationOptions<AuthorizeData, Error, AuthorizeParams>
