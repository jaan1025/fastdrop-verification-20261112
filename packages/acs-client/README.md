# @repo/acs-client

Clique backend (ACS) wire model, HTTP client, and the single chain-classification point for the monorepo.

## Responsibility

Owns everything that touches ACS at the wire level: the domain type model (`Allocation`, `Batch`, `AppConf`, …), the HTTP transport (`createAcsConfig`, `createAcsClient`, `AcsError`), action free-functions, TanStack Query factories, and React hooks. Also owns the **sole chain-classification gate** (`resolveChainKind` / `isEvmChainId` / `isSolanaChainId` / `ChainKind`) — every chain dispatch in the monorepo originates here. Frozen dual-format contracts (ACS chainId grammar, EVM address lowercasing, base58 predicates, CSV sha256, schedule-code byte helpers) live here and ship whole.

## Layer & positioning

Sits above `@repo/shared` (generic zero-dependency utils) and `viem` (EVM types/encoding only). It has **no chain SDK dependency** — no wagmi, no @solana/*, no chain-evm-kit, no chain-solana-kit.

Consumed directly by:

- `@repo/airdrop-base` — derives deterministic codes and claimable math from model types
- `@repo/airdrop-app-shared` — wires `AcsProvider`, auth flows, chain-client resolution, supported-chains catalog
- `@repo/console-app-shared` — configurations, deploy, projects, batches, relayer, import domains
- `apps/vesting-portal`, `apps/vesting-console`, `apps/airdrop-console`, `apps/superadmin` — domain features and query/mutation hooks

## Boundary — what belongs here, what does NOT

- ✅ ACS wire types, camelCase transport layer, HTTP action free-functions
- ✅ `resolveChainKind` / `isEvmChainId` / `isSolanaChainId` / `ChainKind` — the single classification point
- ✅ EVM address normalization (`normalizeEvmAddress`, `withNormalizedAddresses`)
- ✅ Frozen dual-format contracts: ACS chainId grammar, base58 predicates, CSV sha256, ToS byte helpers
- ✅ TanStack Query factories (`./query`) and React hooks (`./react`) — optional peers, no hard dep
- ❌ **No chain SDK** — no wagmi, no @reown/_, no @solana/_, no chain-evm-kit, no chain-solana-kit
- ❌ No product business logic (claimable math, fee encoding, schedule presets — those belong in `@repo/airdrop-base`)
- ❌ No UI components, no Tailwind, no router
- ❌ No app-flow orchestration (providers, login flows — those belong in `@repo/airdrop-app-shared`)
- ❌ No ad-hoc chainId/address sniffing in callers — all chain classification goes through this package's predicates

## Invariants / red lines

- **Frozen dual-format contracts must ship whole.** The ACS chainId grammar (EVM decimal string vs `sol:<cluster>`), EVM address lowercasing, base58 predicates, and CSV sha256 are byte-level idempotency contracts. Never "clean them up" or unify the two arms.
- **Chain-kit-free.** `pnpm check-types` must pass with deps `@repo/shared` + `viem` only. Any wagmi or @solana/* import is a boundary violation.
- **Single classification point.** `resolveChainKind` / `isEvmChainId` / `isSolanaChainId` are the only place raw chainIds are classified. Callers must not sniff ad-hoc.
- **EVM addresses lowercase at the boundary.** `buildJwtMessage` lowercases JWT `iss`/`aud` for EVM; all normalized EVM params go through `normalizeEvmAddress`. Solana base58 is never touched.

---

## Exports

| Subpath       | Exports                                                                                                                                                                                                                                          | Peer deps                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `.`           | Root convenience barrel — re-exports every subpath below under one specifier.                                                                                                                                                                    | (per imported subpath)         |
| `./model`     | Wire model + classification grammar + byte contracts: domain types (`Allocation`, `FeeMode`, …), `resolveChainKind` / `isEvmChainId` / `isSolanaChainId`, `normalizeEvmAddress` / `withNormalizedAddresses`, CSV/schedule-code/ToS byte helpers. | none                           |
| `./transport` | `createAcsConfig`, `createAcsClient`, `AcsError`, `AcsErrorCode`, `requireAppId` / `requireDeployment`, header grammar.                                                                                                                          | none                           |
| `./actions`   | Action free functions (`getAllocations`, `connectAddress`, `getHealth`, …) + their param/response types.                                                                                                                                         | none                           |
| `./query`     | `acsKeys`, per-action `*QueryOptions` / `*MutationOptions` factories (`allocationsQueryOptions`, `userAllocationsQueryOptions`, …).                                                                                                              | `@tanstack/react-query`        |
| `./react`     | `AcsProvider`, `useAdminClient` / `usePublicClient`, query hooks (`useAllocations`, `useUserAllocations`, …), mutation hooks (`useSetClaimRoot`, `useConnectAddress`, …).                                                                        | React, `@tanstack/react-query` |

For the full list per subpath, see `src/{model,transport,actions,query,react}/index.ts`. Peer deps are marked optional in `package.json`, so consumers that only import `./model` / `./transport` / `./actions` don't need to install React / TanStack Query.

## Concepts

| Thing                        | What it is                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Config**                   | A value created by `createAcsConfig({ baseUrl, appId?, deploymentId?, admin?, public? })`. Holds the active identity (`appId` / `deploymentId`) and produces clients on demand. |
| **AdminClient**              | Sends `x-api-key` on every request. Created lazily via `config.getClient('admin')`.                                                                                             |
| **PublicClient**             | Anonymous. Created lazily via `config.getClient('public')`.                                                                                                                     |
| **Action**                   | A free function `action(client, params)`. Also attached to the client as a method (`client.action(params)`). Both forms are equivalent — pick by taste.                         |
| **`appId` / `deploymentId`** | Both optional on the config so bootstrap flows (e.g. `/inspect` before an app is picked) can construct a config first. `deploymentId` can be overridden per call.               |
| **Surface casing**           | Consumer-facing input and output are **camelCase**. Snake-case translation happens at the transport boundary.                                                                   |

## Install

This package is internal to the monorepo (`"private": true`). Add it to a workspace:

```jsonc
{
  "dependencies": {
    "@repo/acs-client": "workspace:*",
  },
}
```

Peer deps (only needed if you import `./query` or `./react`):

```bash
pnpm add @tanstack/react-query react
```

---

## Use without React (framework-agnostic)

For Node scripts, workers, tests, or any non-React consumer — import from
`./transport` (config / client / error) and `./actions` (action free functions).

```ts
import { createAcsConfig } from "@repo/acs-client/transport"

const config = createAcsConfig({
  baseUrl: "https://acs.example.com",
  appId: "my-app",
  deploymentId: "deployment-1",
  admin: { apiKey: process.env.ACS_API_KEY! },
})

const admin = config.getClient("admin")
const pub = config.getClient("public")
```

### Calling actions

Method form is shorter; free-function form is tree-shake-friendly and easier to mock.

```ts
// Method form
const allocations = await admin.getAllocations({ limit: 50, offset: 0 })
const health = await pub.getHealth()

// Free-function form
import { getAllocations, getHealth } from "@repo/acs-client/actions"

const allocations2 = await getAllocations(admin, { limit: 50, offset: 0 })
const health2 = await getHealth(pub)
```

### Per-call deployment override

Deployment-scoped actions read `client.deploymentId` by default. Pass `deploymentId` in params to override for one call:

```ts
await admin.setClaimRoot({
  deploymentId: "other-deployment",
  root: "0x…",
  total: "1000",
})
```

### Errors

All transport errors throw `AcsError`. It carries `status`, `statusText`, `body`, `url`, `message`, and a numeric `code` lifted from the backend body (`{ error, code }`).

```ts
import { AcsError, AcsErrorCode } from "@repo/acs-client/transport"

try {
  await admin.getAllocations({ limit: 10 })
} catch (e) {
  if (e instanceof AcsError) {
    if (e.code === AcsErrorCode.AllocationNotFound) {
      // domain-specific branch
    }
    console.error(e.status, e.code, e.message)
  }
  throw e
}
```

`code` is `number | undefined` (undefined for network errors and non-JSON bodies). `AcsErrorCode` mirrors the known backend codes — useful for branching, but the type stays `number` so backend-added codes don't break consumers.

---

## Use with React

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createAcsConfig } from "@repo/acs-client/transport"
import { AcsProvider } from "@repo/acs-client/react"

const queryClient = new QueryClient()

export function AppProviders({ children }: { children: React.ReactNode }) {
  const config = useMemo(
    () =>
      createAcsConfig({
        baseUrl: import.meta.env.VITE_ACS_BASE_URL,
        appId,
        deploymentId,
        admin: apiKey ? { apiKey } : undefined,
      }),
    [appId, deploymentId, apiKey],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AcsProvider config={config}>{children}</AcsProvider>
    </QueryClientProvider>
  )
}
```

The `config` value is what changes when the active app/deployment changes — recreate it (memoized on its inputs) and the hooks below pick up new clients automatically. Query keys carry `appId` / `deploymentId` directly, so switching app or deployment naturally lands on a different key without invalidating unrelated caches.

### Query hooks

One hook per read endpoint. Same call shape as the underlying action:

```tsx
import {
  useAllocations,
  useBatchStats,
  useUserAllocations,
  useHealth,
} from "@repo/acs-client/react"

function AllocationsTable() {
  const { data, isLoading } = useAllocations({ limit: 50, offset: 0 })
  // …
}
```

### Mutation hooks

```tsx
import { useSetClaimRoot } from "@repo/acs-client/react"

function ClaimRootForm() {
  const setClaimRoot = useSetClaimRoot()

  return (
    <button
      onClick={() => setClaimRoot.mutate({ root: "0x…", total: "1000" })}
      disabled={setClaimRoot.isPending}
    >
      Set
    </button>
  )
}
```

Mutation hooks don't auto-invalidate — call `queryClient.invalidateQueries({ queryKey: acsKeys.admin.allocations(appId, params) })` from `onSuccess` where you need it.

### Direct client access

When a hook doesn't fit (one-off call, custom flow, imperative use inside an event handler):

```tsx
import { useAdminClient, usePublicClient } from "@repo/acs-client/react"

function ConnectButton() {
  const pub = usePublicClient()
  const onClick = async () => {
    await pub.connectAddress({ address, signature, authToken })
  }
  return <button onClick={onClick}>Connect</button>
}
```

### Composing with `queryOptions` directly

For prefetching, suspense queries, or custom `useQueries`, import the factories from `./query`:

```ts
import { allocationsQueryOptions, acsKeys } from "@repo/acs-client/query"
import { useAdminClient } from "@repo/acs-client/react"

const client = useAdminClient()
queryClient.prefetchQuery(allocationsQueryOptions(client, { limit: 50 }))
```

`acsKeys` is the query-key factory. Use it for invalidations:

```ts
queryClient.invalidateQueries({
  queryKey: acsKeys.admin.allocations(config.appId, params),
})
```

Each key carries only what the endpoint depends on — `appId`, `deploymentId`, and per-call params. Two configs with the same `appId` share their cache (which is what you want); different `appId`s land on different keys.

---

## Conventions

- **camelCase only at the boundary.** All inputs and outputs the consumer touches are camelCase. Admin responses go through a generic `camelizeKeys` walker at the transport. A handful of endpoints with mixed snake/camel wire formats (e.g. `FeeMode`, file-upload `FormData`) translate inline. When the backend switches to `rename_all = "camelCase"` everywhere, the `camelizeKeys` wrapper can be removed.
- **EVM addresses are lowercased.** The backend matches addresses case-sensitively and stores them lowercase. The client normalizes EVM addresses in params; Solana base58 is untouched. Use `normalizeEvmAddress` / `withNormalizedAddresses` from `./model` if you need it directly.
- **No global singleton.** There is no `configureAcsClient()`. Every consumer builds a `config` and passes clients (or the config) explicitly. Multiple configs in one process are fine.
- **Bring your own `QueryClient`.** The package never instantiates a `QueryClient` and doesn't ship a provider for it.
