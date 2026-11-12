"use client"
import { useQuery } from "@tanstack/react-query"
import {
  batchStatsQueryOptions,
  type AdminBatchStatsQueryKey,
} from "../../../query/admin/batch-stats"
import type { BatchStat } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { useAdminClient } from "../../use-acs-config"

export const useBatchStats = <TData = BatchStat>(
  parameters: QueryParameter<BatchStat, Error, TData, AdminBatchStatsQueryKey> = {},
) => {
  const client = useAdminClient()
  return useQuery({
    ...batchStatsQueryOptions(client),
    ...parameters.query,
  })
}
