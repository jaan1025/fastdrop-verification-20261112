// The Clique-ACS header grammar — the single home for how this SDK authenticates
// requests (absorbed from `@repo/shared`'s removed HTTP policy; §2.2). Pure
// (builds plain header maps). No auth secrets baked in — values come from
// injected accessors (L8).

/** Which header set a client sends. */
export type AcsClientKind = "admin" | "public"

/** Admin client header inputs. */
export interface AdminHeaderConfig {
  /** Value sent as `x-api-key`. */
  apiKey: string
}

/**
 * Public client header inputs — optional Clique session headers, injected from
 * the composition root. Public routes otherwise authenticate by body signature.
 */
export interface PublicHeaderConfig {
  /** Accessor for the active `clq-app-id` header. */
  getAppId?: () => string | undefined
  /** Accessor for the active `clq-jwt` header (from `@repo/auth`). */
  getJwt?: () => string | undefined
}

/** Clique header name constants. */
export const ACS_HEADER = {
  apiKey: "x-api-key",
  appId: "clq-app-id",
  jwt: "clq-jwt",
  requestId: "x-request-id",
} as const

export const buildAdminHeaders = (config: AdminHeaderConfig): Record<string, string> => ({
  [ACS_HEADER.apiKey]: config.apiKey,
})

export const buildPublicHeaders = (config: PublicHeaderConfig): Record<string, string> => {
  const headers: Record<string, string> = {}
  const appId = config.getAppId?.()
  if (appId) headers[ACS_HEADER.appId] = appId
  const jwt = config.getJwt?.()
  if (jwt) headers[ACS_HEADER.jwt] = jwt
  return headers
}
