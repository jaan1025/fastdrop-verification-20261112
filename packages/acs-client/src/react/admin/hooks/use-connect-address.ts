"use client"
import { useMutation } from "@tanstack/react-query"
import {
  connectAddressMutationOptions,
  type ConnectAddressData,
} from "../../../query/admin/connect-address"
import type { ConnectAddressParams } from "../../../actions/admin/connect-address"
import type { MutationParameter } from "../../types/mutation-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseConnectAddressParameters<TContext = unknown> = MutationParameter<
  ConnectAddressData,
  Error,
  ConnectAddressParams,
  TContext
>

export const useConnectAddress = <TContext = unknown>(
  parameters: UseConnectAddressParameters<TContext> = {},
) => {
  const client = useAdminClient()
  const { mutation } = parameters
  return useMutation({
    ...connectAddressMutationOptions(client),
    ...mutation,
  })
}
