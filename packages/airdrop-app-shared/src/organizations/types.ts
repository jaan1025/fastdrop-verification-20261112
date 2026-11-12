/**
 * Minimal org-list shape the switching subset consumes.
 *
 * The org LIST source differs per app — consoles fetch an admin `"all"`-scope
 * list, the portal a `read:appConf`-scope list — so the source is NOT owned
 * here. Apps inject a list of these summaries into `useSortedOrganizations`,
 * `useActiveOrganizationId`, and `OrganizationSwitchModal`.
 *
 * Only `organizationId` and `displayName` are read by the switching tree
 * (keys, filter, recency lookup, active-id match, navigation, avatar, toast).
 */
export interface OrganizationSummary {
  organizationId: string
  displayName: string
}
