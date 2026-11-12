import type { Allocation, Batch, BatchStatus } from "@repo/acs-client/model"

/**
 * The extended batch status space. Revoke is NOT a wire status — it is an
 * `Approved` batch whose live `configuration` (claim root / schedule code) has
 * been cleared in app_conf. `ResolvedBatchStatus` adds `'revoked'` to the wire
 * `BatchStatus` so every consumer reads one canonical status.
 */
export type ResolvedBatchStatus = BatchStatus | "revoked"

/**
 * A batch is "revoked" when it stays `Approved` but its `configuration` has been
 * emptied in app_conf — the admin revoke action clears the batch's schedule code
 * rather than flipping its wire status. This is the app-conf/batch-level revoke
 * signal (NOT an on-chain clawback; batch-revoke ≠ stream-revoke).
 *
 * Decided off the LIVE `Batch.configuration` (never a frozen
 * `allocation.extra.scheduleCode`) — consistent with the
 * resolve-batch-schedule-code contract.
 *
 * Single source of truth for the console stream status and the portal claim
 * gate.
 */
export function isBatchRevoked(
  batch: Pick<Batch, "status" | "configuration"> | undefined,
): boolean {
  // Optional-chained to match legacy `derive.ts`: a batch present in an
  // allocation row but absent from app_conf `root` is `undefined` at runtime
  // (the index access is not null-checked by TS) and must read as un-revoked,
  // not crash the card/detail.
  return batch?.status === "Approved" && batch.configuration === ""
}

/**
 * The single batch-status derivation read by both the kit/console badge label
 * map and the portal claim gate: `'revoked'` when {@link isBatchRevoked}, else
 * the wire `status`. The `ResolvedBatchStatus → label/variant` map stays in the
 * app/kit UI layer (divergent by design — admin vocabulary).
 */
export function resolveBatchStatus(
  batch: Pick<Batch, "status" | "configuration">,
): ResolvedBatchStatus {
  return isBatchRevoked(batch) ? "revoked" : batch.status
}

/**
 * The schedule code that governs a batch's on-chain reads RIGHT NOW — the single
 * source of truth for the preset / schedule lookups behind every stream surface
 * (portal list card / detail header / detail body; console allocation/stream
 * views). Keying every surface off the SAME code is what keeps a stream from
 * rendering divergent status across surfaces.
 *
 * The live app_conf `Batch.configuration` wins over the allocation row's frozen
 * upload-time `scheduleCode`: a "Change schedule" admin edit is reflected, and a
 * revoked batch (its live config emptied to `""`) collapses the schedule to
 * nothing. `??` (not `||`) is deliberate — an empty live config (`""`, revoked)
 * must be PRESERVED, not fall back to the stale frozen code; only an absent root
 * entry (`undefined`) falls back.
 *
 * Returns `string | undefined` — DO NOT bake a `?? ""` coalesce in here. Callers
 * that need the empty-string form (console list/stream surfaces) append it
 * themselves; others (airdrop allocation hook) rely on the `undefined`.
 */
export function resolveBatchScheduleCode(
  batch: { configuration?: string } | undefined,
  allocation: Pick<Allocation, "extra">,
): string | undefined {
  return batch?.configuration ?? allocation.extra?.scheduleCode
}
