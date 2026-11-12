// Resolves Sentry env, split by exposure. Mono read the DSN from
// `NEXT_PUBLIC_SENTRY_DSN` (public/client) and the build vars from bare
// `SENTRY_*` / `CI` (server). Under Vite/TanStack Start:
//   - the DSN is a CLIENT var → `VITE_SENTRY_DSN` (VITE_ prefix ⇒ inlined into
//     the client bundle at build);
//   - org / project / auth token / CI are BUILD/SERVER-only → read from
//     `process.env` WITHOUT a VITE_ prefix so they never ship to the browser.
// This preserves mono's server/client split. Vite injects `import.meta.env`;
// node/vitest tooling exposes `process.env`, so client reads consult both — the
// same idiom, owned by @repo/shared/utils (readClientEnv).

import { readClientEnv } from "@repo/shared/utils"

const readServerEnv = (key: string): string | undefined => globalThis.process?.env?.[key]

const trimmed = (value: string | undefined): string | undefined => {
  const t = value?.trim()
  return t ? t : undefined
}

/**
 * The Sentry DSN, or `undefined` when unset/blank. This value gates the entire
 * integration: without it, every init no-ops and the vite plugin returns the
 * config untouched (mono treated any falsy DSN as "off").
 */
export const resolveSentryDsn = (): string | undefined => trimmed(readClientEnv("VITE_SENTRY_DSN"))

/**
 * The Sentry organization slug from build env, or `undefined` when unset. The
 * caller applies the `2046inc-xyz` default (kept out of this resolver so it
 * stays a pure env read).
 */
export const resolveSentryOrg = (): string | undefined => trimmed(readServerEnv("SENTRY_ORG"))

/** The Sentry project slug from build env, or `undefined` when unset. */
export const resolveSentryProject = (): string | undefined =>
  trimmed(readServerEnv("SENTRY_PROJECT"))

/**
 * The Sentry auth token for source-map uploads, or `undefined` when unset.
 * Present only in CI/CD — never in client or normal server runtime.
 */
export const resolveSentryAuthToken = (): string | undefined =>
  trimmed(readServerEnv("SENTRY_AUTH_TOKEN"))

/**
 * Whether the current process is a CI build. Mono kept the plugin silent unless
 * CI (`silent: !process.env.CI`); this mirrors that truthiness check.
 */
export const isCiBuild = (): boolean => Boolean(trimmed(readServerEnv("CI")))
