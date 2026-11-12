import type { AppIdScope } from "../types/inspect"

/**
 * Per-app admin scope sentinel: an inspect entry whose scopes include `all`
 * administers that app (this is what "Add team member" grants). Distinct from
 * `InspectResult.admin`, which is true only for super-admins holding an
 * `app_id = "all"` auth row.
 */
export const ADMIN_SCOPE = "all"

/**
 * True when `entry.scopes` includes `ADMIN_SCOPE`; per-app admin check, NOT the
 * super-admin flag (`admin:true` requires the `app_id="all"` row).
 */
export const isAdminScoped = (entry: AppIdScope): boolean => entry.scopes.includes(ADMIN_SCOPE)
