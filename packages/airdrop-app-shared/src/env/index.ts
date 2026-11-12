// Curated barrel for `@repo/airdrop-app-shared/env`: truly-shared runtime config
// every app reads once from `import.meta.env`. (The portal is URL/route-driven —
// it derives its org/appId from `:organizationId`, not from pinned env — so there
// is no separate portal-env surface.)
export { runtimeEnv, type RuntimeEnv } from "./runtime"
