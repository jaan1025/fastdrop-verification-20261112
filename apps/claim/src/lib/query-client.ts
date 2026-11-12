import { createQueryClient } from "@repo/query"
import { toastError } from "@repo/toast"
import type { QueryClient } from "@tanstack/react-query"

// One QueryClient with the repo policy (retry:2, staleTime 20s, viem-error
// swallow, meta.errorMessage → toast). mono built this in `providers/providers.tsx`
// with `createQueryClient({ onError: toastError })`; here it is a shared factory so
// the router (SSR context) and the client both get the same configured client.
//
// Server: a fresh client per request (no cross-request cache leakage). Client: a
// stable module singleton so navigations reuse the cache.
let clientSingleton: QueryClient | undefined

const makeClient = (): QueryClient => createQueryClient({ onError: toastError })

export const getQueryClient = (): QueryClient => {
  if (typeof window === "undefined") {
    // Server — always a new client (request-scoped).
    return makeClient()
  }
  if (!clientSingleton) clientSingleton = makeClient()
  return clientSingleton
}
