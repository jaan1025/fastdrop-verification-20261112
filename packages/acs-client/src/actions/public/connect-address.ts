import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import { normalizeEvmAddress, type AddressBindingResult } from "../../model"

export interface GetConnectAddressesParams {
  address: string
  isReverseResolve?: boolean
}

export const getConnectAddresses = (client: AcsClient, params: GetConnectAddressesParams) =>
  client.request<{ data: AddressBindingResult }>("/connect_address", {
    query: {
      appId: requireAppId(client, "getConnectAddresses"),
      address: normalizeEvmAddress(params.address),
      isReverseResolve: params.isReverseResolve,
    },
  })
