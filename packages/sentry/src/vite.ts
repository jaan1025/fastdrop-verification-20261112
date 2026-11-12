import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite"
import type { TunnelRouteOptions } from "@sentry/tanstackstart-react/vite"

import {
  isCiBuild,
  resolveSentryAuthToken,
  resolveSentryDsn,
  resolveSentryOrg,
  resolveSentryProject,
} from "./env"
import { DEFAULT_SENTRY_ORG, buildSentryPluginOptions } from "./vite-config"

// Build-time wiring — the TanStack Start replacement for mono's next-config
// `withSentry`. Returns the Sentry vite plugin(s) to spread into a Vite config's
// `plugins` array (after `tanstackStart()`), or an empty array when disabled /
// DSN-less, so unconfigured builds are untouched.
//
//   // vite.config.ts
//   import { withSentry } from '@repo/sentry/vite'
//   export default defineConfig({
//     plugins: [tanstackStart(), ...withSentry({ project: 'claim' })],
//   })

export type SentryVitePlugins = ReturnType<typeof sentryTanstackStart>

export interface SentryViteOptions {
  /** Org slug. Defaults to env `SENTRY_ORG`, then {@link DEFAULT_SENTRY_ORG}. */
  org?: string
  /** Project slug. Defaults to env `SENTRY_PROJECT`. */
  project?: string
  /** Ad-blocker-bypass tunnel route: a path, `true` (managed), or full options. */
  tunnelRoute?: TunnelRouteOptions
  /** Disable Sentry build integration entirely. */
  disabled?: boolean
}

/**
 * Returns the Sentry vite plugins, or `[]` when disabled or when
 * `VITE_SENTRY_DSN` is unset (mirrors mono returning the config untouched).
 * Source maps are uploaded (authToken-gated, CI-silent) and deleted after
 * upload for security; org/project/token fall back to build env.
 */
export function withSentry(options: SentryViteOptions = {}): SentryVitePlugins {
  const { org, project, tunnelRoute, disabled = false } = options

  if (disabled || !resolveSentryDsn()) {
    return []
  }

  return sentryTanstackStart(
    buildSentryPluginOptions({
      org: org ?? resolveSentryOrg(),
      project: project ?? resolveSentryProject(),
      authToken: resolveSentryAuthToken(),
      isCi: isCiBuild(),
      tunnelRoute,
    }),
  )
}

export { DEFAULT_SENTRY_ORG }
export { sentryTanstackStart }
export type { TunnelRouteOptions }
