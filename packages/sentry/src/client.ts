import {
  addIntegration,
  captureException,
  captureMessage,
  init,
  tanstackRouterBrowserTracingIntegration,
} from "@sentry/tanstackstart-react"

import { resolveSentryDsn } from "./env"
import { buildClientInitOptions } from "./sampling"

// Client composition root — the one client-side place that names the SDK. Wire
// this in the browser entry (e.g. `src/client.tsx`, first import). Mono wired
// the same via Next's `instrumentation-client.ts`.

const isDevelopment = import.meta.env?.MODE === "development"

/**
 * Initialize the Sentry browser SDK with the project sampling contract
 * (100% traces dev / 10% prod, replay disabled, PII on). No-ops (and dev-warns)
 * when `VITE_SENTRY_DSN` is unset, so unconfigured deployments never error.
 */
export function initClientSentry(): void {
  const dsn = resolveSentryDsn()

  if (!dsn) {
    if (isDevelopment) {
      console.warn("[Sentry] VITE_SENTRY_DSN is not set, skipping client initialization")
    }
    return
  }

  init(buildClientInitOptions(dsn, { isDevelopment }))
}

// TanStack Router navigation-tracing integration. This is the TanStack Start
// replacement for mono's `captureRouterTransitionStart` (a Next app-router hook
// that has no equivalent here). Add it in the router factory, e.g.:
//   if (!router.isServer)
//     Sentry.addIntegration(tanstackRouterBrowserTracingIntegration(router))
export { addIntegration, tanstackRouterBrowserTracingIntegration }

// Capture utilities re-exported for convenience on the client (also available
// server-side from the root door).
export { captureException, captureMessage }
