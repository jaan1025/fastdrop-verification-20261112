import type {
  SentryTanstackStartOptions,
  TunnelRouteOptions,
} from "@sentry/tanstackstart-react/vite"

// Pure builder for the @sentry/tanstackstart-react vite-plugin options. This is
// the TanStack Start replacement for mono's `withSentryConfig` next-config
// wrapper. The build-time contract is preserved:
//   - org defaults to '2046inc-xyz'
//   - authToken (source-map uploads) is CI/CD-only
//   - silent unless CI
//   - source maps deleted after upload for security
//   - tunnelRoute (ad-blocker bypass) passed through only when requested
// Keeping this a pure object builder lets the contract be golden-tested without
// invoking the actual vite plugin.

/** Mono's default Sentry org slug, preserved. */
export const DEFAULT_SENTRY_ORG = "2046inc-xyz"

export interface SentryPluginOptionsInput {
  /** Org slug; defaults to {@link DEFAULT_SENTRY_ORG}. */
  org?: string
  /** Project slug. */
  project?: string
  /** Auth token for source-map upload (CI/CD only). */
  authToken?: string
  /** True in CI → verbose plugin logging; false → silent. */
  isCi?: boolean
  /** Ad-blocker-bypass tunnel route: a path, `true` (managed), or full options. */
  tunnelRoute?: TunnelRouteOptions
}

/**
 * Builds the option object passed to `sentryTanstackStart(...)`. `tunnelRoute`
 * is included only when provided, so the plugin's own default (no tunnel) holds
 * otherwise. Source maps are always deleted after upload.
 */
export const buildSentryPluginOptions = ({
  org = DEFAULT_SENTRY_ORG,
  project,
  authToken,
  isCi = false,
  tunnelRoute,
}: SentryPluginOptionsInput): SentryTanstackStartOptions => {
  const options: SentryTanstackStartOptions = {
    org,
    project,
    authToken,
    // Only print upload logs in CI (mono: `silent: !process.env.CI`).
    silent: !isCi,
    // Delete source maps after upload so they never ship (security).
    sourcemaps: {
      filesToDeleteAfterUpload: ["./**/*.map"],
    },
  }

  if (tunnelRoute !== undefined) {
    options.tunnelRoute = tunnelRoute
  }

  return options
}
