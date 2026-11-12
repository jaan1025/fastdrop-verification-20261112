import { createRouter } from "@tanstack/react-router"
import { NotFound } from "@repo/components/widgets/not-found"

import { getQueryClient } from "~/lib/query-client"
import { routeTree } from "./routeTree.gen"

// Router factory. TanStack Start calls this on both server and client.
//
// The QueryClient is a per-request singleton on the server (via getQueryClient)
// and a stable module singleton on the client, so route loaders / components
// share one cache. Sentry navigation-tracing is intentionally NOT wired here
// (see the placeholder/registration archetype note): @sentry/tanstackstart-react
// is a transitive dep of @repo/sentry and @repo/sentry/client does not re-export
// addIntegration. Error capture still works via initClientSentry + the root
// errorComponent.
export function getRouter() {
  return createRouter({
    routeTree,
    basepath: import.meta.env.BASE_URL,
    scrollRestoration: true,
    context: { queryClient: getQueryClient() },
    defaultNotFoundComponent: () => <NotFound />,
  })
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
