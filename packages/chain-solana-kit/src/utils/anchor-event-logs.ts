import { base64ToBytes } from "@repo/shared/utils"

const PROGRAM_DATA_PREFIX = "Program data: "
// Guard before decoding: a "Program data:" line that isn't clean base64 is not
// an anchor event; `atob`-based decoding would throw (or worse, mis-decode).
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/

/** Raw anchor event payloads (8-byte discriminator ‖ borsh body) from tx log messages. */
export const extractAnchorEventPayloads = (logMessages: readonly string[]): Uint8Array[] => {
  const payloads: Uint8Array[] = []
  for (const line of logMessages) {
    if (!line.startsWith(PROGRAM_DATA_PREFIX)) continue
    const b64 = line.slice(PROGRAM_DATA_PREFIX.length).trim()
    if (!BASE64_RE.test(b64)) continue
    payloads.push(base64ToBytes(b64))
  }
  return payloads
}

const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i])

/** First event in the logs matching an 8-byte anchor discriminator, decoded. */
export const findAnchorEvent = <T>(
  logMessages: readonly string[],
  discriminator: Uint8Array,
  decode: (bytes: Uint8Array) => T,
): T | null => {
  for (const payload of extractAnchorEventPayloads(logMessages)) {
    if (payload.length < 8) continue
    if (!bytesEqual(payload.subarray(0, 8), discriminator)) continue
    return decode(payload.subarray(8))
  }
  return null
}
