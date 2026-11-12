import { decodeJwt } from "./parse"

// True when the token is malformed, the payload is missing a numeric `exp`, or
// `exp` is at/before now (unix seconds). Used by app route guards (`_app.tsx`,
// `index.tsx`) outside React, and by `isAuthenticatedAtom`. Reads `exp` from the
// validated `JwtPayload` (via `decodeJwt`) instead of re-indexing raw claims.
export const isTokenExpired = (token: string): boolean => {
  const exp = decodeJwt(token)?.payload.exp
  if (typeof exp !== "number") return true
  return exp < Date.now() / 1000
}
