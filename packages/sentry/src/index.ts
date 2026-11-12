// Root door — server-safe exports only. Client init (`initClientSentry`,
// `tanstackRouterBrowserTracingIntegration`) is intentionally omitted here and
// must be imported from `@repo/sentry/client`, so client-only browser-SDK code
// never bundles into the server runtime (a real invariant carried over from
// mono's index/client split).

// Server init.
export { initServerSentry } from "./server"

// Error boundary component.
export { GlobalError } from "./error-boundary"
export type { GlobalErrorProps } from "./error-boundary"

// Capture utilities (server-safe; resolve to no-ops without an active client).
export { captureException, captureMessage } from "@sentry/tanstackstart-react"
