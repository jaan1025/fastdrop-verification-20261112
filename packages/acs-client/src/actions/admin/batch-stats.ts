import { camelCaseDeep } from "@repo/shared/utils"
import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import type { BatchStat } from "../../model"

// This endpoint owns its response shaping (M1/M2/D18). `/admin/stats` is a
// confirmed snake_case suspect — the legacy blanket camelizer turned
// `claimed_allocation_amount`/`claimed_users_count` (and the nested per-batch /
// per-schedule rows) into the camel fields on `BatchStat`, so it opts into the
// shared `camelCaseDeep` here. Audit against the live response + pin a fixture when
// the backend URL lands; until then this reproduces the legacy camelization.
// (NOTE: `claimed*` are signature-issued bookkeeping, not real on-chain claimed —
// see the `BatchStat` type.)
export const fromWireBatchStat = (raw: unknown): BatchStat => camelCaseDeep(raw) as BatchStat

export const getBatchStats = async (client: AcsClient): Promise<BatchStat> => {
  const raw = await client.request<unknown>(`/admin/stats/${requireAppId(client, "getBatchStats")}`)
  return fromWireBatchStat(raw)
}
