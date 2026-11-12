export interface AppIdScope {
  displayName?: string
  /** Granted scope strings (`read:`/`write:`/bare grammar). */
  scopes: string[]
}

export interface InspectResult {
  /** The resolved address/identity handler being inspected. */
  handler: string
  /** Super-admin flag; true only for the `app_id="all"` row. */
  admin: boolean
  /** appId → granted scope entry. */
  scopes: Record<string, AppIdScope>
}
