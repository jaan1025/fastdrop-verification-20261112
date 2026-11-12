// ACS config factory: holds backend URL + app/deployment scope + injected
// session/auth accessors; lazily builds & caches one admin and one public
// `AcsClient`.
import { createAcsClient, type AcsClient } from "./client"
import { AcsErrorCode, createAcsError } from "./error"

export interface CreateAcsConfigOptions {
  /** Backend base URL. */
  baseUrl: string
  /**
   * App / org id. Left `undefined` (NOT coerced to `''`) for bootstrap flows;
   * app-scoped actions assert it via `requireAppId` and fail fast (M3 fix).
   */
  appId?: string
  /** Active deployment; per-call overridable. */
  deploymentId?: string
  /** Provide to enable an admin client; omit for portal-only apps. */
  admin?: { apiKey: string }
  /** Clique session-header accessors injected at the composition root. */
  publicHeaders?: {
    getAppId?: () => string | undefined
    getJwt?: () => string | undefined
  }
  /** Forwarded to clients; 401 handler. */
  onUnauthorized?: () => void
  /** Default per-request timeout; 0 disables; default 30000. */
  defaultTimeoutMs?: number
}

export interface AcsConfig {
  readonly baseUrl: string
  /** Active app id (undefined in bootstrap). */
  readonly appId: string | undefined
  readonly deploymentId: string | undefined
  /** Whether an admin client can be built. */
  readonly hasAdmin: boolean
  /**
   * Overloaded lazy resolver. Throws a tagged `AcsError` on `'admin'` when no
   * admin config was provided.
   */
  readonly getClient: {
    (kind: "admin"): AcsClient
    (kind: "public"): AcsClient
  }
}

export const createAcsConfig = (options: CreateAcsConfigOptions): AcsConfig => {
  const cache = new Map<"admin" | "public", AcsClient>()

  const buildClient = (kind: "admin" | "public"): AcsClient => {
    if (kind === "admin" && !options.admin) {
      throw createAcsError({
        status: 0,
        statusText: "Bad Request",
        body: undefined,
        url: options.baseUrl,
        message:
          "No admin client configured. Pass `admin: { apiKey }` to createAcsConfig before requesting an admin client.",
        code: AcsErrorCode.InvalidAppId,
      })
    }
    return createAcsClient({
      kind,
      baseUrl: options.baseUrl,
      appId: options.appId,
      deploymentId: options.deploymentId,
      admin: options.admin,
      publicHeaders: options.publicHeaders,
      defaultTimeoutMs: options.defaultTimeoutMs,
      onUnauthorized: options.onUnauthorized,
    })
  }

  function getClient(kind: "admin"): AcsClient
  function getClient(kind: "public"): AcsClient
  function getClient(kind: "admin" | "public"): AcsClient {
    const cached = cache.get(kind)
    if (cached) return cached
    const client = buildClient(kind)
    cache.set(kind, client)
    return client
  }

  return {
    baseUrl: options.baseUrl,
    appId: options.appId,
    deploymentId: options.deploymentId,
    hasAdmin: Boolean(options.admin),
    getClient,
  }
}
