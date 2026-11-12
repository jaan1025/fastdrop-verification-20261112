/**
 * A single allocation row — the unified shape returned by both the admin
 * `/admin/allocation/{appId}` endpoint and the public `/allocations`
 * endpoint. The backend itself has wire-format inconsistencies (admin uses
 * snake_case, public uses camelCase, admin includes `id`/`sig` while public
 * omits them); each action's `fromWire` normalizes everything to this single
 * camelCase shape before returning to consumers.
 */
export interface Allocation {
  batch: string
  addressHandler: string
  allocation: string
  /** Always present in the response; `null` if not yet claimed (stamped at signature-issuance, not on-chain). */
  claimAt: string | null
  /** Always present in the response; `null` if the backend has no metadata. */
  extra: AllocationExtra | null

  /** Admin-only. Omitted from the public response. */
  id?: number
  /** Admin-only. Omitted from the public response. */
  sig?: string
}

export interface AllocationExtra {
  // Admin-side metadata (set at upload time).
  stakeHolder?: string
  recipient?: string
  /** **Frozen** schedule code captured at upload (diverges from live `Batch.configuration` after a schedule edit — both kept by design). */
  scheduleCode?: string
  category?: string
  // Public-side claim data (Merkle proof attached when fetched for a user).
  proof?: string[]
  // Backend stores `extra` as untyped JSON — allow arbitrary keys.
  [key: string]: unknown
}

export interface AllocationResponse {
  allocations: Allocation[]
  cursor: string
  total: number
}

export type AllocationSortKey = "batch" | "addressHandler" | "streamId"
export type AllocationSortOrder = "asc" | "desc"

export interface AllocationInitParams {
  page?: number
  pageSize?: number
  /** Filter by batch names (joined with comma server-side). */
  filterBatch?: string[]
  filterAddressHandler?: string
  filterStreamId?: number
  /** Filter by schedule codes (joined with comma server-side). */
  filterScheduleCode?: string[]
  sortKey?: AllocationSortKey
  sortOrder?: AllocationSortOrder
}

export type AllocationQueryParams = AllocationInitParams | { page: number; cursor: string }
