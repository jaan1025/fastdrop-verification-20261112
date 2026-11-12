import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { isAcsError } from "@repo/acs-client/transport"
import { EVENTS } from "@repo/shared/constants"
import { emitGlobalEvent } from "@repo/shared/event"

/**
 * Builds a `QueryClient` wired to the app's auth-failure conventions:
 *
 * - Any cached query or mutation that errors with HTTP 401 emits a global
 *   `Unauthorized` event — the auth feature listens for this and sweeps
 *   session state.
 * - Retries are suppressed on 401/403 (auth failures don't recover by
 *   retrying) and capped at 2 for everything else; mutations never retry.
 *
 * Pure factory — the provider that wraps the React tree lives in
 * `query-provider.tsx`.
 */
export function createConfiguredQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (err) => {
        if (isUnauthorized(err)) emitGlobalEvent(EVENTS.Unauthorized)
      },
    }),
    mutationCache: new MutationCache({
      onError: (err) => {
        if (isUnauthorized(err)) emitGlobalEvent(EVENTS.Unauthorized)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, err) => {
          const status = extractStatus(err)
          if (status === 401 || status === 403) return false
          return count < 2
        },
      },
      mutations: { retry: false },
    },
  })
}

function extractStatus(err: unknown): number | undefined {
  if (isAcsError(err)) return err.status
  const e = err as {
    response?: { status?: number }
    cause?: { response?: { status?: number } }
  }
  return e?.response?.status ?? e?.cause?.response?.status
}

function isUnauthorized(err: unknown): boolean {
  return extractStatus(err) === 401
}
