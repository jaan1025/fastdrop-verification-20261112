// The curated `@repo/acs-client/transport` barrel — client/config factories, the
// tagged error model, header grammar, and the scope-guard pair. Named re-exports.
// `buildAdminHeaders`/`buildPublicHeaders` stay internal (not re-exported).
export { createAcsConfig, type AcsConfig, type CreateAcsConfigOptions } from "./config"
export {
  createAcsClient,
  type AcsClient,
  type CreateAcsClientOptions,
  type RequestOptions,
} from "./client"
export { createAcsError, isAcsError, type AcsError, AcsErrorCode } from "./error"
export { ACS_HEADER, type AcsClientKind } from "./headers"
export { requireAppId, requireDeployment } from "./guards"
