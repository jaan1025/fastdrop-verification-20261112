"use client"
import { useQuery } from "@tanstack/react-query"
import {
  connectAddressesQueryOptions,
  type ConnectAddressesQueryKey,
} from "../../../query/public/connect-address"
import type { AddressBindingResult } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { usePublicClient } from "../../use-acs-config"

type ConnectAddressesData = { data: AddressBindingResult }

export type UseConnectAddressesParameters<TData = ConnectAddressesData> = {
  address: string | undefined
  isReverseResolve?: boolean
} & QueryParameter<ConnectAddressesData, Error, TData, ConnectAddressesQueryKey>

export const useConnectAddresses = <TData = ConnectAddressesData>(
  parameters: UseConnectAddressesParameters<TData>,
) => {
  const client = usePublicClient()
  const { query, ...params } = parameters
  return useQuery({
    ...connectAddressesQueryOptions(client, params),
    ...query,
  })
}
