import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { connectAddress, type ConnectAddressParams } from "../../actions/admin/connect-address"
import { acsKeys } from "../keys"

export type ConnectAddressData = Awaited<ReturnType<typeof connectAddress>>

export const connectAddressMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: ConnectAddressParams) => connectAddress(client, variables),
    mutationKey: [...acsKeys.admin.all(), "connectAddress"] as const,
  }) satisfies UseMutationOptions<ConnectAddressData, Error, ConnectAddressParams>
