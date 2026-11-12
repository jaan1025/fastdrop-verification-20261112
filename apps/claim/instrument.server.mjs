// Sentry server instrumentation. The @sentry/tanstackstart-react vite plugin
// loads this before the server app so the Node SDK instruments everything
// downstream. No-ops (dev-warns) without VITE_SENTRY_DSN, so it is safe to ship
// with Sentry disabled by default.
import { initServerSentry } from "@repo/sentry/server"

initServerSentry()
