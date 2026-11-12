import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios"

// The generic axios client factory — base URL + static headers + timeout +
// injected interceptor hooks. It owns NO platform policy: no `clq-app-id` /
// `clq-jwt` header grammar, no 401→global-event emission, no geo/vpn/429 message
// catalog, no camelCase transform. Those are Clique-ACS policy and live in
// `@repo/acs-client/transport`, which calls this factory and injects its own
// interceptors.

export type RequestInterceptor = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>

export type ResponseErrorInterceptor = (error: unknown) => unknown | Promise<unknown>

export interface CreateClientOptions {
  /** Backend base URL. */
  baseURL: string
  /** Static default headers (no auth/app-id grammar baked in). */
  headers?: Record<string, string>
  /** Request timeout in ms; default 30000. */
  timeoutMs?: number
  /** Injected request interceptor; the only place auth/app-id headers get added. */
  onRequest?: RequestInterceptor
  /** Injected response-error interceptor; the only place 401-handling /
   *  message-mapping happens. May rethrow or transform. */
  onResponseError?: ResponseErrorInterceptor
}

export const createClient = (options: CreateClientOptions): AxiosInstance => {
  const { baseURL, headers, timeoutMs = 30000, onRequest, onResponseError } = options

  const instance = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { ...(headers ?? {}) },
  })

  if (onRequest) {
    instance.interceptors.request.use(onRequest)
  }

  if (onResponseError) {
    instance.interceptors.response.use(
      (response) => response,
      (error) => onResponseError(error),
    )
  }

  return instance
}
