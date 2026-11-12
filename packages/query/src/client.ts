import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

export type ErrorHandler = (error: unknown) => void
export type SwallowPredicate = (error: unknown) => boolean

export interface CreateQueryClientOptions {
  onError?: ErrorHandler
  /**
   * Query-path-only predicate: when it returns `true` the error is logged but
   * NOT forwarded to `onError` (no toast). Defaults to the chain-agnostic
   * viem-swallow (`String(error)` matches `/viem/`) that mono ships with. Inject
   * a custom predicate to swallow a different family of errors, or `() => false`
   * to disable swallowing. Mutations never consult this — they stay silent by
   * default and toast only on `meta.errorMessage`.
   */
  shouldSwallowError?: SwallowPredicate
}

/** Mono's default query swallow: stringified error contains `viem`. */
const swallowViemError: SwallowPredicate = (error) => /viem/.test(String(error))

/**
 * Preconfigured TanStack Query v5 client with app-wide defaults and centralized
 * cache-level error funnels.
 *
 * Meta conventions (a cross-package contract consumers rely on to control toasting):
 *   - query   meta.ignoreError  → suppress the global toast (log only)
 *   - query   meta.errorMessage → override the toast text (else the raw error)
 *   - mutation meta.errorMessage → OPT IN to a toast (mutations are silent otherwise)
 *
 * The /viem/ swallow is deliberate: wallet/RPC errors are logged but never toasted
 * through this path (handled elsewhere) — dropping it double-toasts chain errors.
 *
 * Encodes the v4→v5 migration: per-observer onSuccess/onError are gone; use
 * cache-level handlers instead.
 * https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5#callbacks-on-usequery-and-queryobserver-have-been-removed
 * https://github.com/TanStack/query/discussions/5279
 * https://tkdodo.eu/blog/breaking-react-querys-api-on-purpose
 */
export function createQueryClient(options: CreateQueryClientOptions = {}) {
  const { onError, shouldSwallowError = swallowViemError } = options
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 1000 * 20,
      },
    },

    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error("Query error from react-query::", error)

        if (query.meta?.ignoreError) {
          console.error("Ignored query error from react-query::", error)
          return
        }

        if (shouldSwallowError(error)) {
          console.error("Query error from viem::", error)
          return
        }

        if (onError) {
          onError(query.meta?.errorMessage ?? error)
        }
      },
    }),

    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        console.error("Mutation error from react-query::", error)

        if (onError && mutation.meta?.errorMessage) {
          onError(mutation.meta.errorMessage)
        }
      },
    }),
  })
}
