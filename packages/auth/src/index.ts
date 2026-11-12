// Root barrel for `@repo/auth`: the React auth hooks plus convenience re-exports of
// the `./jwt` and `./storage` surfaces. Deliberately does NOT re-export the raw
// atoms (hooks-only public surface, L5/P3). The package `exports` map exposes
// exactly `.`, `./jwt`, `./storage` — no `./*` wildcard (P3 fixed), so
// `state/atoms.ts` is unreachable by consumers.

export {
  useApiKey,
  useClearSession,
  useEcosystem,
  useIsAuthenticated,
  useSessionExpiredWatch,
  useSetApiKey,
  useSetSessionExpired,
  useUsername,
} from "./hooks"

export {
  buildJwtMessage,
  buildJwtTokenFromBytes,
  buildJwtTokenFromHex,
  decodeJwt,
  isTokenExpired,
  jwtEcosystem,
  parseJwtHeader,
  parseJwtPayload,
} from "./jwt"
export type {
  BuildJwtMessageInput,
  ChainEcosystem,
  DecodedJwt,
  JwtAlg,
  JwtHeader,
  JwtPayload,
} from "./jwt"

export { clearPersistedApiKey, readPersistedApiKey } from "./storage"
