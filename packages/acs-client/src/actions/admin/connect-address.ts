import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import { normalizeEvmAddress, type WalletSet } from "../../model"

export interface ConnectAddressParams {
  addressHandler: string
  address: string
  walletSet: WalletSet
}

export const connectAddress = (client: AcsClient, params: ConnectAddressParams) =>
  client.request<{ message: string; address: string }>("/admin/connect_address", {
    method: "POST",
    body: {
      appId: requireAppId(client, "connectAddress"),
      addressHandler: params.addressHandler,
      address: normalizeEvmAddress(params.address),
      walletSet: params.walletSet,
      // Backend struct still requires this field but ignores it
      // (#[allow(dead_code)]). Send empty until the struct drops it.
      batch: "",
    },
  })
