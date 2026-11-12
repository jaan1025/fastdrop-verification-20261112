import { useParams } from "@tanstack/react-router"

export interface RouteScope {
  organizationId: string | undefined
  projectId: string | undefined
}

/**
 * Reads `:organizationId` and `:projectId` from the current route. With
 * `strict: false`, TanStack Router merges params from the deepest match
 * with everything inherited from its parent matches — so any page inside
 * `/orgs/$organizationId/...` or
 * `/orgs/$organizationId/projects/$projectId/...` picks them up here.
 *
 * Returns `undefined` for either id when not in the route. Shared by
 * `AcsProvider` (translates to appId/deploymentId on the wire) and
 * `SolanaRootProvider` (looks up the project's cluster).
 */
export function useRouteScope(): RouteScope {
  const params = useParams({ strict: false }) as {
    organizationId?: string
    projectId?: string
  }
  return {
    organizationId: params.organizationId,
    projectId: params.projectId,
  }
}
