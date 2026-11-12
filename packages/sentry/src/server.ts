import { captureException, captureMessage, init } from "@sentry/tanstackstart-react"

import { resolveSentryDsn } from "./env"
import { buildServerInitOptions } from "./sampling"

// Server composition root — the one server-side place that names the SDK. Wire
// this in the server entry (the SDK's `instrument.server.mjs`, imported before
// anything else). Mono wired the equivalent via Next's `instrumentation.ts`
// under `NEXT_RUNTIME === 'nodejs'`. TanStack Start has only node (+ browser),
// so mono's Edge runtime init is dropped (no NEXT_RUNTIME === 'edge' path).

const isDevelopment = globalThis.process?.env?.NODE_ENV === "development"

/**
 * Initialize the Sentry Node SDK with the project sampling contract
 * (100% traces dev / 10% prod, PII on). No-ops (and dev-warns) when
 * `VITE_SENTRY_DSN` is unset, so unconfigured deployments never error.
 */
export function initServerSentry(): void {
  const dsn = resolveSentryDsn()

  if (!dsn) {
    if (isDevelopment) {
      console.warn("[Sentry] VITE_SENTRY_DSN is not set, skipping server initialization")
    }
    return
  }

  init(buildServerInitOptions(dsn, { isDevelopment }))
}

// Capture utilities are server-safe (they resolve to no-ops without an active
// client), so they are re-exported here and from the root door.
export { captureException, captureMessage }
