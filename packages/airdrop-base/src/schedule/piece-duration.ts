import { decodePieceDuration } from "../stream/piece-duration"
import type { UnlockInterval } from "./types"

/**
 * [golden-test] The DSL ↔ pieceDuration bridge: maps the schedule DSL's
 * `UnlockInterval` vocabulary onto the raw 256-bit contract encoding (and
 * back). The raw codec itself lives in `stream/piece-duration.ts`; this file
 * owns only the vocabulary mapping — no second copy of the byte layout.
 */

const SECONDS_PER_DAY = 86_400n
const SECONDS_PER_WEEK = 604_800n

/**
 * Typed result of mapping a pieceDuration back to a known interval — replaces the
 * legacy `console.warn` + silent-`'continuous'` fallback (analysis L1).
 */
export type PieceDurationDecodeResult =
  { ok: true; interval: UnlockInterval } | { ok: false; raw: bigint }

/** Encodes an interval to the 256-bit contract pieceDuration. The single encoder. */
export function encodePieceDuration(interval: UnlockInterval): bigint {
  switch (interval) {
    case "continuous":
      return 0n
    case "daily":
      return SECONDS_PER_DAY
    case "weekly":
      return SECONDS_PER_WEEK
    case "monthly":
      return (1n << 64n) | 1n
    case "quarterly":
      return (1n << 64n) | 3n
    case "yearly":
      return (1n << 64n) | 12n
  }
}

/**
 * Maps a pieceDuration back to a known `UnlockInterval`, returning a typed
 * `{ ok: false, raw }` for unrecognized values instead of warning + falling back
 * (analysis L1). No `console.*`, no I/O.
 */
export function pieceDurationToInterval(piece: bigint): PieceDurationDecodeResult {
  const { mode, interval } = decodePieceDuration(piece)
  if (mode === 1n) {
    if (interval === 1n) return { ok: true, interval: "monthly" }
    if (interval === 3n) return { ok: true, interval: "quarterly" }
    if (interval === 12n) return { ok: true, interval: "yearly" }
    return { ok: false, raw: piece }
  }
  if (interval === 0n) return { ok: true, interval: "continuous" }
  if (interval === SECONDS_PER_DAY) return { ok: true, interval: "daily" }
  if (interval === SECONDS_PER_WEEK) return { ok: true, interval: "weekly" }
  return { ok: false, raw: piece }
}
