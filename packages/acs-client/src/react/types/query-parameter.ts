import type { DefaultError, QueryKey, UseQueryOptions } from "@tanstack/react-query"

/**
 * Optional `query` slot for read hooks. Mirrors wagmi v2's
 * `QueryParameter` — lets callers pass standard TanStack Query options
 * (`enabled`, `staleTime`, `select`, `refetchInterval`, …) alongside
 * the hook's business parameters.
 *
 * Omits the keys each hook's `*QueryOptions` factory owns:
 * `queryFn`, `queryHash`, `queryKey`, `queryKeyHashFn`, `throwOnError`.
 */
export type QueryParameter<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = {
  query?:
    | Omit<
        UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
        "queryFn" | "queryHash" | "queryKey" | "queryKeyHashFn" | "throwOnError"
      >
    | undefined
}
