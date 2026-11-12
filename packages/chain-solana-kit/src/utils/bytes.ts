/**
 * Byte-level helpers shared across Solana utilities.
 */
export const toUint8Array = (
  bytes: Uint8Array | { readonly [index: number]: number; readonly length: number },
): Uint8Array => Uint8Array.from(bytes as Uint8Array)

export const concatBytes = (...arrays: Uint8Array[]): Uint8Array => {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const arr of arrays) {
    out.set(arr, offset)
    offset += arr.length
  }
  return out
}

export const encodeU32LE = (value: number): Uint8Array => {
  const buffer = new ArrayBuffer(4)
  new DataView(buffer).setUint32(0, value, true)
  return new Uint8Array(buffer)
}

export const encodeU64LE = (value: bigint): Uint8Array => {
  const buffer = new ArrayBuffer(8)
  new DataView(buffer).setBigUint64(0, value, true)
  return new Uint8Array(buffer)
}

/**
 * Signed 64-bit little-endian (two's-complement). For non-negative values the
 * bytes are identical to `encodeU64LE`; negative values are encoded as their
 * 8-byte two's-complement. Used for on-chain `i64` fields (e.g. Penalty
 * `claim_at`).
 */
export const encodeI64LE = (value: bigint): Uint8Array => {
  const buffer = new ArrayBuffer(8)
  new DataView(buffer).setBigInt64(0, value, true)
  return new Uint8Array(buffer)
}

export const encodeVector = (items: Uint8Array[]): Uint8Array =>
  concatBytes(encodeU32LE(items.length), ...items)

export const encodeBytes = (bytes: Uint8Array): Uint8Array =>
  concatBytes(encodeU32LE(bytes.length), bytes)
