import { skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { getTxHistory } from "../../actions/admin/tx-history"
import { acsKeys } from "../keys"
import type { TxHistoryQueryParams, TxHistoryResponse } from "../../model"
import { withNormalizedAddresses } from "../../model"

export type AdminTxHistoryQueryKey = ReturnType<typeof acsKeys.admin.txHistory>

export const txHistoryQueryOptions = (client: AcsClient, params: TxHistoryQueryParams) => {
  const normalized = withNormalizedAddresses(params, ["iss"])
  return {
    queryKey: acsKeys.admin.txHistory(client.appId ?? "", normalized),
    queryFn: client.appId ? () => getTxHistory(client, normalized) : skipToken,
  } satisfies UseQueryOptions<TxHistoryResponse, Error, TxHistoryResponse, AdminTxHistoryQueryKey>
}
