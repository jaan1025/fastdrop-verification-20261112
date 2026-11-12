import { skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { getBatchStats } from "../../actions/admin/batch-stats"
import { acsKeys } from "../keys"
import type { BatchStat } from "../../model"

export type AdminBatchStatsQueryKey = ReturnType<typeof acsKeys.admin.batchStats>

export const batchStatsQueryOptions = (client: AcsClient) =>
  ({
    queryKey: acsKeys.admin.batchStats(client.appId ?? ""),
    queryFn: client.appId ? () => getBatchStats(client) : skipToken,
  }) satisfies UseQueryOptions<BatchStat, Error, BatchStat, AdminBatchStatsQueryKey>
