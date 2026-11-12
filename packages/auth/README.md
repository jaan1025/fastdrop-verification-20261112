# @repo/auth

Auth/JWT/session primitives: unsigned JWT challenge message building, token encode/decode, expiry, EVM iss/aud lowercasing, and React session state hooks.

## Responsibility

Owns the complete JWT grammar and session state layer:

- **JWT grammar** — the `ChainEcosystem → { alg, canonicalizeIssuer }` descriptor table; the source of the EVM-lowercasing contract (`iss`/`aud` lowercased for `evm`, Solana base58 verbatim).
- **JWT message/token build** — `buildJwtMessage` (unsigned `<b64url(header)>.<b64url(payload)>` challenge), `buildJwtTokenFromBytes`/`buildJwtTokenFromHex` (attach a signature), `decodeJwt`/`parseJwtHeader`/`parseJwtPayload`, `isTokenExpired`, `jwtEcosystem`.
- **Persisted API key storage** — `readPersistedApiKey`/`clearPersistedApiKey`: SSR-safe, framework-free `localStorage` helpers for route guards that run before React mounts.
- **React session state** — thin Jotai-backed hooks (`useApiKey`, `useSetApiKey`, `useIsAuthenticated`, `useEcosystem`, `useUsername`, `useClearSession`, `useSessionExpiredWatch`). Atoms are private; hooks are the only public surface.

## Layer & positioning

Sits at the **auth primitives layer**, directly above `@repo/shared`. It has no product-domain knowledge and no chain SDK.

```
apps/*  ──────────────────────────────────────────────── consumers
@repo/console-app-shared / @repo/airdrop-app-shared ────  auth flow / login hooks / providers
@repo/auth  ◄── YOU ARE HERE ─────────────────────────── JWT grammar + session state
@repo/shared ───────────────────────────────────────────  zero-dep utils (stringToUrlSafeBase64 etc.)
```

**Direct consumers (from grep):**

- `@repo/airdrop-app-shared` — login hooks (`useEvmLogin`, `useSolanaLogin`, `useLoginSuccessHandler`, `useLogout`), session gates (`RequireSession`, `CrossTabAuthGate`, `ServerAuthErrorGate`), `AcsProvider`, `SolanaRootProvider`, `useDualWalletState`.
- `@repo/console-app-shared` — `useOrganizations`, `useGenerateApiKeyEvm`, `useOrgCapability`.
- `apps/vesting-portal`, `apps/vesting-console`, `apps/airdrop-console`, `apps/superadmin` — route guards, sidebar, portfolio detail, import page.

> Note: `@repo/acs-client` does NOT import `@repo/auth` — it receives the active `clq-jwt` value through an injected header accessor (DI from the app), so no upward auth→acs edge exists.

## Boundary — what belongs here, what does NOT

- ✅ Pure JWT grammar: alg/ecosystem table, `iss`/`aud` canonicalization (EVM lowercase, Solana verbatim).
- ✅ Stateless message/token build, parse, expiry — no network, no side effects.
- ✅ Framework-free `localStorage` helpers for the API key (usable in route guards outside React).
- ✅ Thin Jotai hooks exposing session state (api key, ecosystem, username, authenticated, session-expired). Atoms stay private.
- ❌ No chain SDK (`wagmi`, `@reown/*`, `@solana/*`). This is a tier-0 package.
- ❌ No `@repo/acs-client` import — `@repo/auth` is one tier below it. The local EVM-address format check in `grammar.ts` is intentional duplication (documented), not a bug to "fix" by importing upward.
- ❌ No login/logout flow, no `navigate`/`toast`/modal — UX side-effects belong in `@repo/airdrop-app-shared` handlers.
- ❌ No product/domain logic (no allocations, schedules, organizations).
- ❌ Atoms are NOT part of the public surface; never export raw atoms.

## Public surface

| Subpath     | Exports                                                                                                                                                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.` (root)  | All hooks (`useApiKey`, `useSetApiKey`, `useIsAuthenticated`, `useEcosystem`, `useUsername`, `useClearSession`, `useSessionExpiredWatch`) + re-exports of `./jwt` and `readPersistedApiKey`/`clearPersistedApiKey`                                          |
| `./jwt`     | `buildJwtMessage`, `buildJwtTokenFromBytes`, `buildJwtTokenFromHex`, `decodeJwt`, `parseJwtHeader`, `parseJwtPayload`, `isTokenExpired`, `jwtEcosystem`; types: `BuildJwtMessageInput`, `ChainEcosystem`, `DecodedJwt`, `JwtAlg`, `JwtHeader`, `JwtPayload` |
| `./storage` | `readPersistedApiKey`, `clearPersistedApiKey` — imperative localStorage API key helpers, SSR-safe                                                                                                                                                           |

## Invariants / red lines

- **EVM `iss`/`aud` lowercasing is byte-critical.** `buildJwtMessage` lowercases EVM addresses via `grammar.ts` before base64-encoding the payload. The ACS backend exact-matches these fields in lowercase. Solana base58 is case-significant and must never be normalized. This contract is pinned with golden-vector tests.
- **`ChainEcosystem` is a local parallel of `@repo/acs-client`'s `ChainKind`.** The two are byte-identical unions (`'evm' | 'solana'`) kept separate by design — `@repo/auth` cannot import upward into `@repo/acs-client`. Do not "unify" them by introducing that import edge.
- **No wildcard export (`"./*"`).** The exports map exposes exactly `.`, `./jwt`, `./storage`. `state/atoms.ts` is intentionally unreachable by consumers.
