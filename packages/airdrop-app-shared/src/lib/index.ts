// Curated barrel for `@repo/airdrop-app-shared/lib`: app-agnostic runtime
// primitives. The base-URL-override atom stays private. NOTE:
// `WALLET_CONNECT_FALLBACK_PROJECT_ID` is the single canonical constant in
// `@repo/shared/constants` — import it from there, not here.
export {
  useApiBaseUrl,
  useApiBaseUrlOverride,
  useSetApiBaseUrlOverride,
  API_BASE_URL_FALLBACK,
} from "./base-url"
export { evmRole, solRole, role } from "./roles"
export { UNKNOWN_TOKEN_SYMBOL } from "./constants"
export { getShareXLink } from "./share"
