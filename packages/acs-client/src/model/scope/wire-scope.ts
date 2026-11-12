/**
 * The single home for the UI-vocabulary → wire-vocabulary scope mapping (D9).
 * The UI/URL says `organizationId`/`projectId`; the ACS backend says
 * `appId`/`deploymentId` (same data, two vocabularies — see root memory
 * "app=org, deployment=project"). This is the one translation point so consumers
 * (console-kit, app-runtime, portal) never inline the rename.
 */

/** Wire-side scope identifiers. */
export interface WireScope {
  /** Backend app id (UI calls this the organization). */
  appId: string
  /** Backend deployment id (UI calls this the project); absent for app-scoped calls. */
  deploymentId?: string
}

/** UI-side scope identifiers (input to `toWireScope`). */
export interface OrgScope {
  /** UI/URL organization id. */
  organizationId: string
  /** UI/URL project id (URL `projectId` IS the `deploymentId`). */
  projectId?: string
}

/**
 * Maps UI org/project identifiers to wire `{ appId, deploymentId }`; pure 1:1
 * rename (`organizationId → appId`, `projectId → deploymentId`). The **single**
 * home for this boundary — console-kit, app-runtime, and portal import it from
 * `@repo/acs-client/model`.
 */
export const toWireScope = ({ organizationId, projectId }: OrgScope): WireScope => ({
  appId: organizationId,
  deploymentId: projectId,
})
