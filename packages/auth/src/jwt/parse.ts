import { base64ToBytes, bytesToString } from "@repo/shared/utils"
import { ecosystemForAlg, type JwtAlg } from "./grammar"
import type { JwtHeader, JwtPayload } from "./message"

export interface DecodedJwt {
  header: JwtHeader
  payload: JwtPayload
}

// Base64url-decode one segment (`base64ToBytes` → `bytesToString`) then
// `JSON.parse`; returns the raw parsed value (caller validates).
const decodeSegment = (segment: string): unknown =>
  JSON.parse(bytesToString(base64ToBytes(segment)))

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === "object" && raw !== null

// Shape-checks `{ alg, typ }` (alg is a known `JwtAlg`, typ === `"JWT"`); null on
// mismatch. Validated, not cast (P6).
const validateHeader = (raw: unknown): JwtHeader | null => {
  if (!isRecord(raw)) return null
  const { alg, typ } = raw
  if (typeof alg !== "string" || ecosystemForAlg(alg) === null) return null
  if (typ !== "JWT") return null
  // `ecosystemForAlg(alg) !== null` proves `alg` is a known `JwtAlg`, but TS can't
  // narrow a string through that table lookup — assert the validated union.
  return { alg: alg as JwtAlg, typ }
}

// Shape-checks `{ iss, iat, aud, exp, permissions }`; coerces a missing
// `permissions` to `[]` and an array `aud` to its first element; null on mismatch.
// Validated, not cast (P6).
const validatePayload = (raw: unknown): JwtPayload | null => {
  if (!isRecord(raw)) return null
  const { iss, iat, aud, exp, permissions } = raw
  if (typeof iss !== "string") return null
  if (typeof iat !== "number") return null
  if (typeof exp !== "number") return null
  // The wire contract emits a single string `aud`; tolerate a one-element array
  // defensively (legacy behavior) by projecting to its first string element.
  const audStr =
    typeof aud === "string" ? aud : Array.isArray(aud) && typeof aud[0] === "string" ? aud[0] : null
  if (audStr === null) return null
  const perms =
    permissions === undefined
      ? []
      : Array.isArray(permissions) && permissions.every((p) => typeof p === "string")
        ? (permissions as string[])
        : null
  if (perms === null) return null
  return { iss, iat, aud: audStr, exp, permissions: perms }
}

// Splits on `.`, base64url-decodes the first two segments, JSON-parses + validates
// both; returns the typed pair or `null` on malformed/short/invalid token. The
// single decode entry consumers and atoms build on (P7).
export const decodeJwt = (token: string): DecodedJwt | null => {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const header = validateHeader(decodeSegment(parts[0]))
    const payload = validatePayload(decodeSegment(parts[1]))
    if (header === null || payload === null) return null
    return { header, payload }
  } catch {
    return null
  }
}

// Returns the validated payload (or null); thin projection of
// `decodeJwt(token)?.payload`.
export const parseJwtPayload = (token: string): JwtPayload | null =>
  decodeJwt(token)?.payload ?? null

// Returns the validated header (or null); thin projection of
// `decodeJwt(token)?.header`.
export const parseJwtHeader = (token: string): JwtHeader | null => decodeJwt(token)?.header ?? null
