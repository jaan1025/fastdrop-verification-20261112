import { stringToUrlSafeBase64 } from "@repo/shared/utils"
import { JWT_GRAMMAR, type ChainEcosystem, type JwtAlg } from "./grammar"

export interface JwtHeader {
  alg: JwtAlg
  typ: "JWT"
}

export interface JwtPayload {
  iss: string
  iat: number
  aud: string
  exp: number
  permissions: string[]
}

export interface BuildJwtMessageInput {
  address: string
  audience?: string
  ecosystem: ChainEcosystem
  permissions?: string[]
  ttlSeconds?: number
}

// 30 days in seconds; default token lifetime.
const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60

// [golden-test] Builds the unsigned JWT challenge message a wallet signs: the
// literal `<b64url(header)>.<b64url(payload)>` string plus the structured
// header/payload. Resolves `alg` + `iss`/`aud` canonicalization through the
// `grammar.ts` table (no inline if/ternary on ecosystem). The EVM-lowercasing of
// iss/aud is the byte-sensitive contract pinned with EVM (lowercased) + Solana
// (base58 verbatim) golden vectors against ACS. Byte-identical to the ACS-signed
// preimage.
export const buildJwtMessage = (
  input: BuildJwtMessageInput,
): { message: string; header: JwtHeader; payload: JwtPayload } => {
  const grammar = JWT_GRAMMAR[input.ecosystem]
  const now = Math.floor(Date.now() / 1000)
  const exp = now + (input.ttlSeconds ?? DEFAULT_TTL_SECONDS)
  const iss = grammar.canonicalizeIssuer(input.address)
  const aud = input.audience ? grammar.canonicalizeIssuer(input.audience) : iss
  const header: JwtHeader = { alg: grammar.alg, typ: "JWT" }
  const payload: JwtPayload = {
    iss,
    iat: now,
    aud,
    exp,
    permissions: input.permissions ?? ["all"],
  }
  const headerB64 = stringToUrlSafeBase64(JSON.stringify(header))
  const payloadB64 = stringToUrlSafeBase64(JSON.stringify(payload))
  return { message: `${headerB64}.${payloadB64}`, header, payload }
}
