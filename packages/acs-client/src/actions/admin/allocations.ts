import { camelCaseDeep } from "@repo/shared/utils"
import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import {
  normalizeEvmAddress,
  type AllocationQueryParams,
  type AllocationResponse,
  type AllocationSortKey,
} from "../../model"

// Sort-key values are snake_case on the wire (backend enum
// `#[serde(rename_all = "snake_case")]`). Translate at the boundary so consumers
// only ever see camelCase.
const SORT_KEY_WIRE: Record<AllocationSortKey, string> = {
  batch: "batch",
  addressHandler: "address_handler",
  streamId: "stream_id",
}

const buildQuery = (params: AllocationQueryParams) => {
  if ("cursor" in params) {
    return { page: params.page, cursor: params.cursor }
  }
  return {
    page: params.page,
    pageSize: params.pageSize,
    filterBatch: params.filterBatch,
    filterAddressHandler: normalizeEvmAddress(params.filterAddressHandler),
    filterStreamId: params.filterStreamId,
    filterScheduleCode: params.filterScheduleCode,
    sortKey: params.sortKey ? SORT_KEY_WIRE[params.sortKey] : undefined,
    sortOrder: params.sortOrder,
  }
}

// This endpoint owns its response shaping (M1/M2): the admin allocation list
// serializes Rust structs with default serde (snake_case keys), so it opts into
// the shared `camelCaseDeep` normalization at the wire boundary.
export const fromWireAllocations = (raw: unknown): AllocationResponse =>
  camelCaseDeep(raw) as AllocationResponse

export const getAllocations = async (
  client: AcsClient,
  params: AllocationQueryParams,
): Promise<AllocationResponse> => {
  const raw = await client.request<unknown>(
    `/admin/allocation/${requireAppId(client, "getAllocations")}`,
    { query: buildQuery(params) },
  )
  return fromWireAllocations(raw)
}

export interface DeleteAllocationParams {
  batch: string
  addressHandler: string
}

export const deleteAllocation = (client: AcsClient, params: DeleteAllocationParams) =>
  client.request<void>(
    `/admin/allocation/${requireAppId(client, "deleteAllocation")}/${params.batch}/${params.addressHandler}`,
    { method: "DELETE" },
  )
