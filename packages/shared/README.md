# @repo/shared

Generic, zero-dependency utils that form the bottom utility layer of the monorepo — no chain SDK, no domain logic, no router.

## Responsibility

Owns every piece of pure infrastructure that has no natural home higher up: string/address/number/date formatting, byte helpers, async primitives, error extraction, a typed global event bus, generic React hooks (flow state, device detection, time, persist), a localStorage-backed Jotai persist map, and the bare axios client factory. Nothing here knows about Clique's product, ACS wire protocol, or any blockchain SDK.

## Layer & positioning

The bottommost layer. Nothing in `@repo/shared` imports any other `@repo/*` package.

**Consumed by (up):** `@repo/auth`, `@repo/tos-signer-base`, `@repo/acs-client`, `@repo/airdrop-base`, `@repo/chain-evm-kit`, `@repo/chain-solana-kit`, `@repo/airdrop-evm`, `@repo/airdrop-solana`, `@repo/components`, `@repo/patterns`, `@repo/airdrop-app-shared`, `@repo/console-app-shared`, and all `apps/*`.

## Boundary — what belongs here, what does NOT

- ✅ Pure string, number, bigint, date, byte, address-display, and encoding utilities
- ✅ Generic React hooks with no domain or UX side-effects (`useFlowState`, `useNow`, `useTimeLeft`, `usePersistFn`, `useIsMobileLayout`, …)
- ✅ Jotai-backed `usePersistMap` (localStorage persist, no domain key policy)
- ✅ Typed global event bus (`eventemitter3`) + `GlobalEventMap` augmentation protocol — the bus ships empty; consuming packages declare their events via `declare module`
- ✅ Error extraction (`extractErrorMessage`) — generic, never Clique-ACS-specific copy
- ✅ Bare axios client factory (`createClient`) — no auth/app-id grammar, no 401 handling, no camelCase transform
- ✅ Shared constants with no home elsewhere (WalletConnect fallback project ID, `EVENTS.Unauthorized` key)
- ❌ **No chain SDK** — zero `wagmi`/`@reown`, zero `@solana/*`, zero viem contract calls
- ❌ **No domain/product logic** — no ACS wire types, no schedule math, no fee codec, no distributor concepts
- ❌ **No Clique-ACS policy** — geo/VPN/429 friendly-copy catalog, `clq-jwt`/`clq-app-id` header grammar, and 401→event emission all live in `@repo/acs-client/transport`
- ❌ **No router** — no TanStack Router, no Next.js `useRouter`, no navigation side-effects
- ❌ **No upward imports** — must never import any `@repo/*` package

## Public surface

| Subpath                      | Exports                                                                                                                                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@repo/shared/constants`     | `EVENTS` key constants + `WALLET_CONNECT_FALLBACK_PROJECT_ID`                                                                                                                                                     |
| `@repo/shared/errors`        | `extractErrorMessage` — normalize any caught value to a user-safe string                                                                                                                                          |
| `@repo/shared/event`         | Typed `GlobalEventMap` augmentation interface, sync + async global bus helpers (`emitGlobalEvent`, `addGlobalEventListener`, `emitGlobalAsyncEvent`, …), React adapters (`useGlobalEvent`, `useGlobalAsyncEvent`) |
| `@repo/shared/hooks`         | Generic React hooks: `useFlowState`, `usePersistFn`, `useAsyncPersistFn`, `useIsMobileLayout`, `useDeviceDetection`, `useNow`, `useTimeLeft`, `useTimeReached`, `useResolvePathname`                              |
| `@repo/shared/state`         | `usePersistMap` — Jotai `atomFamily`+`atomWithStorage` localStorage map hook                                                                                                                                      |
| `@repo/shared/utils`         | All pure utils: `match`, `bytes`, `number`, `case-deep`, `string`, `predicate`, `json`, `date`, `address`, `env`, `encoding`, `async`, `storage`                                                                  |
| `@repo/shared/utils/address` | Address display helpers only (chain-agnostic)                                                                                                                                                                     |
| `@repo/shared/utils/number`  | Number/bigint formatting + parsing                                                                                                                                                                                |
| `@repo/shared/utils/date`    | UTC-pinned date parsing                                                                                                                                                                                           |
| `@repo/shared/client`        | `createClient` — generic axios instance factory with injected interceptor hooks                                                                                                                                   |

## Invariants / red lines

- **No `@repo/*` imports.** This package has zero intra-monorepo dependencies. Any util that needs another `@repo/*` package does not belong here.
- **`/utils` stays pure-util.** The `utils` subpath intentionally excludes `client`/`event`/`state`/`hooks` re-exports so consumers that only need pure utils do not pull in `axios`, `jotai`, or `react`.
- **`GlobalEventMap` is empty by default.** The event bus carries no Clique-specific event names; consuming packages augment the interface via `declare module '@repo/shared/event'`. This keeps the bus generic and the package free of domain coupling.
- **`createClient` carries no policy.** Auth headers, 401 handling, and message mapping are injected by the caller (`@repo/acs-client/transport`). Never add Clique-ACS policy here.
