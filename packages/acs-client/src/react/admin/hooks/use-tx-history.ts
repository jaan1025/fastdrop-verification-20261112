"use client"
import { useQuery } from "@tanstack/react-query"
import { txHistoryQueryOptions, type AdminTxHistoryQueryKey } from "../../../query/admin/tx-history"
import type { TxHistoryQueryParams, TxHistoryResponse } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { useAdminClient } from "../../use-acs-config"

export type UseTxHistoryParameters<TData = TxHistoryResponse> = TxHistoryQueryParams &
  QueryParameter<TxHistoryResponse, Error, TData, AdminTxHistoryQueryKey>

export const useTxHistory = <TData = TxHistoryResponse>(
  parameters: UseTxHistoryParameters<TData>,
) => {
  const client = useAdminClient()
  const { query, ...params } = parameters
  return useQuery({
    ...txHistoryQueryOptions(client, params),
    ...query,
  })
}
