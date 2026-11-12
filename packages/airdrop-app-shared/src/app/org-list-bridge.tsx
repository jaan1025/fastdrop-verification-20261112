import type { ReactNode } from "react"
import { OrgListProvider } from "../organizations/org-list-context"
import type { OrganizationSummary } from "../organizations/types"

export interface OrgListBridgeProps {
  /**
   * App-specific org-list source hook, called inside the providers so it can read
   * ACS / React Query. Consoles pass the admin `useOrganizations` ("all" scope);
   * the portal passes its recipient-scoped `usePortalOrganizations`. This is the
   * org-source injection point — `OrgListBridge` owns `useOrgList`, not
   * `ProviderStack`. Same pinned shape `OrganizationGate.useOrgSource` consumes.
   */
  useOrgList: () => {
    organizations: OrganizationSummary[]
    isLoading: boolean
    error?: unknown
  }
  children: ReactNode
}

/**
 * Named root part: runs the app-injected org-source hook (which must execute
 * inside the providers so it can read ACS / React Query) and feeds the resulting
 * list into `OrgListProvider` for the org-switching subtree. Replaces the legacy
 * inline `OrgListBridge` buried in `AppRoot`.
 *
 * The real loading flag flows through (no longer hard-coded `isLoading={false}`)
 * so `OrganizationGate` / the switcher can block correctly.
 */
export function OrgListBridge({ useOrgList, children }: OrgListBridgeProps) {
  const { organizations, isLoading } = useOrgList()
  return (
    <OrgListProvider organizations={organizations} isLoading={isLoading}>
      {children}
    </OrgListProvider>
  )
}
