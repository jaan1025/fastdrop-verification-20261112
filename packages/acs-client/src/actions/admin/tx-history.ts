import { camelCaseDeep } from "@repo/shared/utils"
import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import { normalizeEvmAddress, type TxHistoryQueryParams, type TxHistoryResponse } from "../../model"

// This endpoint owns its response shaping (M1/M2/D18). `/admin/history` is a
// snake_case suspect — the legacy code relied on the blanket camelizer to turn
// `tx_hash`/`tx_type`/`chain_id`/`created_at` into the camel fields declared on
// `TxHistoryRecord`, so it opts into the shared `camelCaseDeep` here. Audit against
// the live response + pin a fixture when the backend URL lands; until then this
// reproduces the legacy camelization.
export const fromWireTxHistory = (raw: unknown): TxHistoryResponse =>
  camelCaseDeep(raw) as TxHistoryResponse

export const getTxHistory = async (
  client: AcsClient,
  params: TxHistoryQueryParams,
): Promise<TxHistoryResponse> => {
  const raw = await client.request<unknown>(
    `/admin/history/${requireAppId(client, "getTxHistory")}`,
    {
      query: {
        limit: params.limit,
        offset: params.offset,
        txType: params.txType,
        status: params.status,
        chainId: params.chainId,
        txHash: params.txHash,
        iss: normalizeEvmAddress(params.iss),
      },
    },
  )
  return fromWireTxHistory(raw)
}
