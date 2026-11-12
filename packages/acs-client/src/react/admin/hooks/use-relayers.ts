"use client"
import { useQuery } from "@tanstack/react-query"
import { relayersQueryOptions, type AdminRelayersQueryKey } from "../../../query/admin/relayer"
import type { RelayerResponse } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { useAdminClient } from "../../use-acs-config"

export const useRelayers = <TData = RelayerResponse[]>(
  parameters: QueryParameter<RelayerResponse[], Error, TData, AdminRelayersQueryKey> = {},
) => {
  const client = useAdminClient()
  return useQuery({
    ...relayersQueryOptions(client),
    ...parameters.query,
  })
}
