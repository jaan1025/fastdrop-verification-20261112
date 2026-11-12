import { skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { getConnectAddresses } from "../../actions/public/connect-address"
import { acsKeys } from "../keys"
import { normalizeEvmAddress } from "../../model"
import type { AddressBindingResult } from "../../model"

type ConnectAddressesData = { data: AddressBindingResult }

export type ConnectAddressesQueryKey = ReturnType<typeof acsKeys.public.connectAddresses>

export const connectAddressesQueryOptions = (
  client: AcsClient,
  params: { address: string | undefined; isReverseResolve?: boolean },
) => {
  const address = normalizeEvmAddress(params.address)
  return {
    queryKey: acsKeys.public.connectAddresses({
      appId: client.appId ?? "",
      address,
      isReverseResolve: params.isReverseResolve,
    }),
    queryFn: address
      ? () =>
          getConnectAddresses(client, {
            address,
            isReverseResolve: params.isReverseResolve,
          })
      : skipToken,
  } satisfies UseQueryOptions<
    ConnectAddressesData,
    Error,
    ConnectAddressesData,
    ConnectAddressesQueryKey
  >
}
