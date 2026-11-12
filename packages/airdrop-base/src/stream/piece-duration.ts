/**
 * [golden-test] The raw 256-bit `pieceDuration` codec — the grammar of
 * `Stream.piece_duration` as both lock programs decode it. No DSL vocabulary
 * here; the `UnlockInterval` ↔ pieceDuration bridge lives in
 * `schedule/piece-duration.ts`.
 *
 * Layout: the contract decodes the 256-bit value as
 *   byte 23      = mode (0 = linear/interval, 1 = calendar-month)
 *   bytes 24..31 = u64 BE interval
 * encoded as `(mode << 64) | value`; the rest of the high bits are zero.
 * Mode 0 — value is seconds (continuous=0, daily=86400, weekly=604800).
 * Mode 1 — value is months (monthly=1, quarterly=3, yearly=12); the contract
 * walks calendar months at claim time.
 */

/** The split form of a 256-bit pieceDuration. */
export interface DecodedPieceDuration {
  /** 0 = interval/seconds, 1 = calendar months (byte 23). */
  mode: bigint
  /** u64 interval value (bytes 24..31 BE). */
  interval: bigint
}

/** Splits the 256-bit value into mode + interval (SCHEME-006). The low-level decoder. */
export function decodePieceDuration(pieceDuration: bigint): DecodedPieceDuration {
  const mode = (pieceDuration >> 64n) & 0xffn
  const interval = pieceDuration & ((1n << 64n) - 1n)
  return { mode, interval }
}

/**
 * Repacks a Solana 32-byte big-endian pieceDuration (byte 23 = mode, bytes 24..31
 * = u64 interval) into the same 256-bit shape EVM uses. The single Solana-bytes
 * decoder.
 */
export function pieceDurationFromSolanaBytes(bytes: ReadonlyArray<number> | Uint8Array): bigint {
  const arr = Array.isArray(bytes) ? bytes : Array.from(bytes)
  const mode = BigInt(arr[23] ?? 0)
  let interval = 0n
  for (let i = 24; i < 32; i++) {
    interval = (interval << 8n) | BigInt(arr[i] ?? 0)
  }
  return (mode << 64n) | interval
}
