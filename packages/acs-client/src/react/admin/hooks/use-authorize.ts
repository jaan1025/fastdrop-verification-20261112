"use client"
import { useMutation } from "@tanstack/react-query"
import { authorizeMutationOptions, type AuthorizeData } from "../../../query/admin/auth"
import type { AuthorizeParams } from "../../../actions/admin/auth"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseAuthorizeParameters<TContext = unknown> = MutationParameter<
  AuthorizeData,
  Error,
  AuthorizeParams,
  TContext
>

export const useAuthorize = <TContext = unknown>(
  parameters: UseAuthorizeParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...authorizeMutationOptions(client),
    ...mutation,
  })
}
