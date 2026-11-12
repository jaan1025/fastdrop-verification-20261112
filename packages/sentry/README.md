# @repo/sentry

Centralized Sentry error-monitoring integration for TanStack Start apps — the one place that names `@sentry/tanstackstart-react` and encodes the project's Sentry conventions.

## Responsibility

Owns the runtime init contract (client + server), the build-time source-map / tunnel wiring (via the Sentry vite plugin), a styled global-error component, and re-exports of the common capture utilities. It encodes the project policy: DSN from `VITE_SENTRY_DSN`, org default `2046inc-xyz`, **100% trace sampling in dev / 10% in prod**, PII enabled, session replay disabled — and no-ops cleanly everywhere the DSN is unset.

Ported from mono's `@airdrop/sentry` (Next SDK). The Next-specific surface — `withSentryConfig` next-config wrapper, `instrumentation.ts` hooks, `captureRouterTransitionStart`, the Edge runtime, and `captureRequestError` — has no TanStack Start equivalent and is replaced (see [Migration from mono](#migration-from-mono)).

## Public surface

| Subpath            | Exposes                                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.` (root)         | `initServerSentry`, `GlobalError`, `GlobalErrorProps`, `captureException`, `captureMessage` — **server-safe only** (no client init, so browser-SDK code never bundles server-side) |
| `./client`         | `initClientSentry`, `tanstackRouterBrowserTracingIntegration`, `captureException`, `captureMessage`                                                                                |
| `./server`         | `initServerSentry`, `captureException`, `captureMessage`                                                                                                                           |
| `./error-boundary` | `GlobalError`, `GlobalErrorProps`                                                                                                                                                  |
| `./vite`           | `withSentry`, `SentryViteOptions`, `SentryVitePlugins`, `sentryTanstackStart`, `DEFAULT_SENTRY_ORG`, `TunnelRouteOptions`                                                          |

Pure, golden-tested builders back the runtime/build objects: `buildClientInitOptions` / `buildServerInitOptions` (sampling), `buildSentryPluginOptions` (source-map/tunnel), and the env resolvers (`resolveSentryDsn`, …). They are internal — apps consume the wiring functions above.

## Environment variables

| Var                 | Exposure                                             | Purpose                                                                                         |
| ------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `VITE_SENTRY_DSN`   | **client** (VITE_ ⇒ inlined into the browser bundle) | The DSN. Gates the whole integration — unset ⇒ every init no-ops and `withSentry` returns `[]`. |
| `SENTRY_ORG`        | build/server (no VITE_ prefix)                       | Org slug. Falls back to `2046inc-xyz`.                                                          |
| `SENTRY_PROJECT`    | build/server                                         | Project slug for source-map upload.                                                             |
| `SENTRY_AUTH_TOKEN` | build/server (CI/CD only)                            | Auth token for source-map upload.                                                               |
| `CI`                | build/server                                         | Truthy ⇒ verbose plugin logging; unset ⇒ silent.                                                |

The client/server split is deliberate: only the DSN carries `VITE_` and reaches the browser; the upload credentials stay server/CI-only and never ship.

---

## App wiring (P4)

Each consuming TanStack Start app must add four wiring points. Nothing here throws when `VITE_SENTRY_DSN` is unset, so these are safe to add unconditionally.

### 1. Client init — browser entry (`src/client.tsx`, first import)

```ts
import { initClientSentry } from "@repo/sentry/client"

initClientSentry()
```

### 2. Router navigation tracing — router factory (`src/router.tsx`)

```ts
import { addIntegration } from "@sentry/tanstackstart-react"
import { tanstackRouterBrowserTracingIntegration } from "@repo/sentry/client"
import { createRouter } from "@tanstack/react-router"

export const getRouter = () => {
  const router = createRouter({/* … */})
  if (!router.isServer) {
    addIntegration(tanstackRouterBrowserTracingIntegration(router))
  }
  return router
}
```

This replaces mono's `captureRouterTransitionStart` (a Next app-router hook with no TanStack equivalent).

### 3. Server init — server instrument file (`instrument.server.mjs`, imported before the app)

```ts
import { initServerSentry } from "@repo/sentry/server"

initServerSentry()
```

Load this first in the server entry so the SDK instruments everything downstream. TanStack Start runs node (+ browser) only — mono's Edge runtime init is intentionally dropped.

### 4. Build-time — source maps + tunnel (`vite.config.ts`)

```ts
import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { withSentry } from "@repo/sentry/vite"

export default defineConfig({
  // Vite needs a real (non-inline) sourcemap to upload:
  build: { sourcemap: true },
  plugins: [
    tanstackStart(),
    // Spread — withSentry returns an array of plugins (or [] when disabled/DSN-less).
    ...withSentry({
      project: "claim", // or via SENTRY_PROJECT
      // org defaults to SENTRY_ORG, then '2046inc-xyz'
      // tunnelRoute: '/monitoring',  // opt-in ad-blocker bypass
    }),
  ],
})
```

`withSentry` uploads source maps (authToken-gated via `SENTRY_AUTH_TOKEN`, silent unless `CI`) and **deletes the `.map` files after upload** (`filesToDeleteAfterUpload: ['./**/*.map']`) so maps never ship. Pass `{ disabled: true }` to force-off regardless of env.

> **Tunnel route.** `tunnelRoute` routes Sentry envelope traffic through the app origin to bypass ad blockers. It is **opt-in** (omit ⇒ no tunnel; the mono JSDoc claimed a `/monitoring` default but its code default was undefined — the real default is off). Pass a path (`'/monitoring'`) or `true` for a managed opaque route.

### 5. Error boundary — router / root error component

`GlobalError` renders the styled error panel (centered column, copyable 8-char Error ID, "Try again"). Wire it as the router's error component or in the root route's `errorComponent`:

```tsx
import { GlobalError } from "@repo/sentry/error-boundary"

// TanStack Router error component signature: ({ error, reset }) => …
export const errorComponent = ({ error, reset }) => <GlobalError error={error} reset={reset} />
```

Unlike mono's Next `global-error.tsx`, this component does **not** render its own `<html><body>` (TanStack Start boundaries render inside the existing document). `reset` is optional — when the router doesn't supply one, "Try again" falls back to a full reload. Capture only fires when a Sentry client is active, so the boundary is inert without a DSN.

---

## Sampling contract (do not drift)

Ported verbatim from mono; pinned by golden tests in `sampling.test.ts`:

- `tracesSampleRate`: **1.0 dev / 0.1 prod** — both runtimes.
- `replaysSessionSampleRate` / `replaysOnErrorSampleRate`: **0 / 0** (session replay disabled).
- `sendDefaultPii`: **true** on client **and** server (adds request headers + IP). Not set on any dropped edge path.

## Migration from mono

| mono (`@airdrop/sentry`, Next SDK)                                     | here (TanStack Start)                                          |
| ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `initClientSentry` in `instrumentation-client.ts`                      | `initClientSentry` in the browser entry                        |
| `captureRouterTransitionStart` (Next app-router)                       | `tanstackRouterBrowserTracingIntegration(router)`              |
| `initServerSentry` in `instrumentation.ts` (`NEXT_RUNTIME==='nodejs'`) | `initServerSentry` in `instrument.server.mjs`                  |
| `initEdgeSentry` (`NEXT_RUNTIME==='edge'`)                             | **dropped** — no Edge runtime in TanStack Start                |
| `withSentry(nextConfig, …)` / `withSentryConfig`                       | `withSentry(options)` → vite plugins                           |
| `captureRequestError` (Next `onRequestError`)                          | **dropped** — replaced by TanStack Start server-error handling |
| `GlobalError` renders `<html><body>`                                   | `GlobalError` renders just the panel; `reset` optional         |
| `NEXT_PUBLIC_SENTRY_DSN`                                               | `VITE_SENTRY_DSN`                                              |

## Invariants / red lines

- **Root door is server-safe only.** Client init lives at `@repo/sentry/client`; never re-export it from the root (would bundle browser-SDK code server-side).
- **DSN gates everything.** No DSN ⇒ every init no-ops (dev-warns), `withSentry` ⇒ `[]`, `GlobalError` doesn't capture. Unconfigured deployments must never error.
- **Sampling values are a contract.** Change them only by intent, and re-pin the golden tests.
- **Source maps are deleted after upload.** Never remove `filesToDeleteAfterUpload`.
