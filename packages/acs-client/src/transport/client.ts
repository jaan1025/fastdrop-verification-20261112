// The ONE ACS client factory (replaces the two parallel admin/public
// client+decorator families; H2). Builds a transport-backed client discriminated
// by `kind`, on top of `@repo/shared`'s generic `createClient`; owns URL/query
// building, JSON/FormData bodies, timeout/abort, header injection, 401→event, and
// error normalization to the tagged `AcsError`. No method-form actions attached —
// actions are free functions in `/actions`.
import {
  createClient,
  type RequestInterceptor,
  type ResponseErrorInterceptor,
} from "@repo/shared/client"
import { emitGlobalEvent } from "@repo/shared/event"
import { createAcsError, extractCode, extractMessage } from "./error"
import {
  buildAdminHeaders,
  buildPublicHeaders,
  type AcsClientKind,
  type AdminHeaderConfig,
  type PublicHeaderConfig,
} from "./headers"

// The `unauthorized` global event is Clique-ACS policy, not generic shared
// infrastructure — so this package augments the shared event registry to declare
// it (the shared `GlobalEventMap` is intentionally empty; §2.2).
declare module "@repo/shared/event" {
  interface GlobalEventMap {
    unauthorized: []
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<
    string,
    string | number | boolean | null | undefined | readonly (string | number)[]
  >
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Override the client's default timeout for this request. */
  timeoutMs?: number
}

export interface AcsClient {
  /** `'admin' | 'public'` discriminant. */
  readonly kind: AcsClientKind
  /** App/org scope (undefined in bootstrap; actions assert via `requireAppId`). */
  readonly appId: string | undefined
  /** Default deployment; per-call overridable. */
  readonly deploymentId: string | undefined
  /**
   * Issue a request: builds URL+query, injects headers, composes timeout/abort,
   * parses body, throws `AcsError` on network/non-OK; runs `onUnauthorized` on
   * 401.
   */
  request: <T = unknown>(path: string, options?: RequestOptions) => Promise<T>
}

export interface CreateAcsClientOptions {
  kind: AcsClientKind
  baseUrl: string
  appId?: string
  deploymentId?: string
  /** Required when `kind === 'admin'` (the `x-api-key`); a build-time invariant. */
  admin?: AdminHeaderConfig
  /** Clique session-header accessors when `kind === 'public'`. */
  publicHeaders?: PublicHeaderConfig
  /** Default per-request timeout; 0 disables; default 30000. */
  defaultTimeoutMs?: number
  /** Invoked on 401 (e.g. trigger re-auth); the composition root wires it. */
  onUnauthorized?: () => void
}

// Structural shape of the axios error we read in `onResponseError` — duck-typed
// so this file never imports `axios` directly (it builds purely on the shared
// generic client; §2.2).
interface WireError {
  message?: string
  code?: string
  config?: { url?: string }
  response?: {
    status: number
    statusText: string
    data: unknown
    headers?: Record<string, unknown>
  }
}

const isBrowser = (): boolean => typeof window !== "undefined"

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData

/** Serialize a query map into axios `params` (arrays comma-joined, nullish skipped). */
const buildParams = (query: RequestOptions["query"]): Record<string, string> | undefined => {
  if (!query) return undefined
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      if (value.length > 0) params[key] = value.join(",")
    } else {
      params[key] = String(value)
    }
  }
  return params
}

const readHeaderReason = (headers: Record<string, unknown> | undefined): unknown =>
  headers?.["reason"] ?? headers?.["Reason"]

export const createAcsClient = (options: CreateAcsClientOptions): AcsClient => {
  if (options.kind === "admin" && !options.admin) {
    throw createAcsError({
      status: 0,
      statusText: "Bad Request",
      body: undefined,
      url: options.baseUrl,
      message: 'createAcsClient({ kind: "admin" }) requires `admin: { apiKey }`.',
    })
  }

  // Header injection is the only place auth/app-id grammar is added.
  const onRequest: RequestInterceptor = (config) => {
    if (options.kind === "admin" && options.admin) {
      const headers = buildAdminHeaders(options.admin)
      for (const [k, v] of Object.entries(headers)) config.headers.set(k, v)
    } else if (options.kind === "public" && options.publicHeaders) {
      // Session headers are read at send time so JWT/app-id rotations are
      // picked up. Browser-only (mirrors the legacy guard) unless an appId
      // accessor is provided (SSR-safe).
      if (isBrowser() || options.publicHeaders.getAppId) {
        const headers = buildPublicHeaders(options.publicHeaders)
        for (const [k, v] of Object.entries(headers)) config.headers.set(k, v)
      }
    }
    return config
  }

  // Normalize a non-OK / network error to the tagged `AcsError`, applying the
  // Clique geo/vpn/429 status catalog (absorbed from shared's removed HTTP
  // policy; §2.2). Rethrows the tagged error so callers `isAcsError(e)`.
  const onResponseError: ResponseErrorInterceptor = (error) => {
    const wire = error as WireError
    const url = wire.config?.url ?? ""

    // Caller-initiated cancellation (an aborted `AbortSignal`) propagates
    // unchanged rather than being masked as a `status: 0` network error —
    // restores parity with the pre-axios transport's `AbortError` pass-through
    // so cancellation stays detectable by error shape.
    if (wire.code === "ERR_CANCELED") {
      return Promise.reject(error)
    }

    if (wire.response) {
      const { status, statusText, data, headers } = wire.response
      if (status === 401) {
        emitGlobalEvent("unauthorized")
        options.onUnauthorized?.()
      }
      const reason = readHeaderReason(headers)
      const message =
        status === 401
          ? "Unauthorized"
          : status === 403 && reason === "geo"
            ? "Access from your current location is not permitted."
            : status === 403 && reason === "vpn"
              ? "Please disable your VPN to proceed."
              : status === 429
                ? "Too many requests. Please try again later."
                : extractMessage(data, `${status} ${statusText}`)
      return Promise.reject(
        createAcsError({
          status,
          statusText,
          body: data,
          url,
          message,
          code: extractCode(data),
        }),
      )
    }

    if (wire.code === "ECONNABORTED") {
      return Promise.reject(
        createAcsError({
          status: 0,
          statusText: "Timeout",
          body: undefined,
          url,
          message: "Request timed out. Please try again.",
        }),
      )
    }

    return Promise.reject(
      createAcsError({
        status: 0,
        statusText: "Network Error",
        body: undefined,
        url,
        message: wire.message
          ? `Network error: ${wire.message}`
          : "Connection failed. Check your internet and try again.",
      }),
    )
  }

  const instance = createClient({
    baseURL: options.baseUrl,
    timeoutMs: options.defaultTimeoutMs ?? 30000,
    onRequest,
    onResponseError,
  })

  return {
    kind: options.kind,
    appId: options.appId,
    deploymentId: options.deploymentId,
    request: async <T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> => {
      const { method = "GET", body, query, headers, signal, timeoutMs } = opts
      const sendingFormData = isFormData(body)

      const requestHeaders: Record<string, string> = { ...headers }
      if (body !== undefined && !sendingFormData) {
        requestHeaders["Content-Type"] = requestHeaders["Content-Type"] ?? "application/json"
      }

      const res = await instance.request<T>({
        url: path,
        method,
        params: buildParams(query),
        headers: requestHeaders,
        data: body,
        signal,
        ...(timeoutMs !== undefined ? { timeout: timeoutMs } : {}),
      })
      return res.data
    },
  }
}
