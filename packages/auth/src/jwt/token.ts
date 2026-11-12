import { bytesToUrlSafeBase64, hexToBytes } from "@repo/shared/utils"

// Validates the hex signature body (after stripping an optional `0x`).
const HEX_PATTERN = /^[0-9a-fA-F]+$/

// The shared encode tail: `${message}.${bytesToUrlSafeBase64(signatureBytes)}`.
// Single home for the message→token concatenation, factored out of the two public
// siblings (P9).
const appendSignature = (message: string, signatureBytes: Uint8Array): string =>
  `${message}.${bytesToUrlSafeBase64(signatureBytes)}`

// [golden-test] Validates a hex (0x-optional, even-length) signature, normalizes to
// bytes via `hexToBytes`, and appends it as base64url to `message`. Throws on
// invalid/odd-length hex. The EVM login assembly entry point.
export const buildJwtTokenFromHex = (message: string, signature: string): string => {
  const hex = signature.startsWith("0x") ? signature.slice(2) : signature
  if (hex.length === 0 || hex.length % 2 !== 0 || !HEX_PATTERN.test(hex)) {
    throw new Error(`Invalid hex signature (length=${hex.length}, expected even-length hex)`)
  }
  return appendSignature(message, hexToBytes(`0x${hex}`))
}

// [golden-test] Validates a non-empty `Uint8Array` signature and appends it as
// base64url to `message`. Throws on non-`Uint8Array` or zero length. The Solana
// login assembly entry point.
export const buildJwtTokenFromBytes = (message: string, signature: Uint8Array): string => {
  if (!(signature instanceof Uint8Array)) {
    throw new Error(`Invalid signature: expected Uint8Array, got ${typeof signature}`)
  }
  if (signature.length === 0) {
    throw new Error("Invalid signature: zero-length")
  }
  return appendSignature(message, signature)
}
