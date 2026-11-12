// The ONE scope-guard pair (H3/M3/M4). Resolves + asserts app/deployment scope,
// failing fast with a descriptive tagged `AcsError` — replaces the duplicated
// `requireDeployment` (admin + public) AND the legacy `appId === ''` placeholder.
// Pure.
import { AcsErrorCode, createAcsError } from "./error"

/**
 * Returns `scope.appId` or throws a descriptive `AcsError` (`InvalidAppId`) when
 * missing/empty. App-scoped actions call this instead of silently building
 * `/admin/app_conf/` with an empty segment.
 */
export const requireAppId = (scope: { appId: string | undefined }, actionName?: string): string => {
  if (scope.appId) return scope.appId
  throw createAcsError({
    status: 0,
    statusText: "Bad Request",
    body: undefined,
    url: "",
    message: `${actionName ?? "This action"} requires an appId — pass it on createAcsConfig before calling.`,
    code: AcsErrorCode.InvalidAppId,
  })
}

/**
 * Resolves a deployment id: per-call override → client default → throw. Single
 * home for deployment-scoped admin + public actions.
 */
export const requireDeployment = (
  scope: { deploymentId: string | undefined },
  override?: string,
  actionName?: string,
): string => {
  const deployment = override ?? scope.deploymentId
  if (deployment) return deployment
  throw createAcsError({
    status: 0,
    statusText: "Bad Request",
    body: undefined,
    url: "",
    message: `${actionName ?? "This action"} requires a deploymentId — pass it on createAcsConfig or per-call.`,
    code: AcsErrorCode.InvalidBatch,
  })
}
