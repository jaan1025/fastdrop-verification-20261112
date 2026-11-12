/**
 * NOTE on `claimed*`: the ACS `/admin/stats` endpoint sets `claim_at` when it
 * issues a server claim signature, NOT when a claim confirms on-chain. So both
 * `claimedUsersCount` and `claimedAllocationAmount` count signatures issued
 * (including partial, deferred, and never-submitted claims) and sum the FULL
 * allocation of those users — they are bookkeeping, not real claimed value, and
 * not on-chain. Do not surface them as "claimed". For real claimed totals use
 * the on-chain indexer. Kept on the type because the server still returns them.
 */
export interface SingleBatchStat {
  batch: string
  totalUsersCount: number
  /** Users with an issued claim signature (NOT on-chain confirmed). */
  claimedUsersCount: number
  totalAllocationAmount: string
  /** Sum of FULL allocations of signature-issued users (NOT real claimed). */
  claimedAllocationAmount: string
}

/** See {@link SingleBatchStat} for the `claimed*` caveat (signature-gated, not on-chain). */
export interface SingleScheduleStat {
  scheduleCode: string
  totalUsersCount: number
  claimedUsersCount: number
  totalAllocationAmount: string
  claimedAllocationAmount: string
}

export interface BatchStat {
  perBatchStats: SingleBatchStat[]
  perScheduleStats: SingleScheduleStat[]
}
