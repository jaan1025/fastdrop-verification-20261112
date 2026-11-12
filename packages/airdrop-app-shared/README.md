# @repo/airdrop-app-shared

The base app-shared infrastructure layer — app-flow orchestration (providers, auth, chain, organizations, wallet-control, claim) shared across every product app and `@repo/console-app-shared`.

## Responsibility

Owns everything that is needed at the composition root of any product app but is too app-coupled to live in a lower-layer package:

- **Chain primitives** — the single home for `useChainClients` / `resolveChainClients`, `confirmTx` + per-chain leaves (`confirm-tx-evm`, `confirm-tx-solana`), `useConfirmTx`, the supported-chains catalog (`ALL_KNOWN_CHAINS`, `getSupportedChain`, `chainDisplayName`), and `getTransactionExplorerLink`.
- **Providers** — EVM (`EvmProvider`, AppKit init via `ensureAppKit`) and Solana (`SolanaRootProvider`) chain providers; `QueryProvider` (TanStack Query root); `AcsProvider` (ACS HTTP client context); `ProviderStack` (the composed app-root stack).
- **Auth** — login/logout facades (`useLogin`, `useLogout`), per-chain login leaves kept internal, inspect/success-handler/error-bridge hooks, auth-gating components (`RequireSession`, `CrossTabAuthGate`, `ServerAuthErrorGate`), `LoginShell` / `LoginButton` / `ApiKeyForm` / `ToSConsentLine` UI, TOS-signer hosts.
- **Organizations** — org-list context, active-org resolution, recency/switcher hooks, `OrganizationGate`, `OrganizationSwitchModal`, `OrganizationAvatar`.
- **Wallet control** — `WalletControl` component (dual-chain: EVM + Solana wallet state unified under one UI).
- **Claim hooks** — five chain-dispatch claim facades: `useDistributorClaimPortal`, `useDistributorClaimAdmin`, `useDistributorClaimPaymaster`, `useLockClaimPortal`, `useLockClaimAdmin`. Each mounts both `-evm` / `-solana` arms unconditionally (Rules of Hooks), dispatches via `resolveChainKind`.
- **Runtime lib** — `useApiBaseUrl` / override atom, `runtimeEnv`, `evmRole` / `solRole` / `role` typed-boundary helpers, `UNKNOWN_TOKEN_SYMBOL`, `getShareXLink`, `useRouteScope`.

## Layer & positioning

```
@repo/shared / @repo/auth / @repo/tos-signer-base / @repo/acs-client
    @repo/airdrop-base / @repo/chain-evm-kit / @repo/chain-solana-kit
        @repo/airdrop-evm / @repo/airdrop-solana / @repo/components
            ▶  @repo/airdrop-app-shared   (A2 — base app-shared)
                @repo/console-app-shared  (A1 — console product layer)
                    apps/*
```

**Depends on (downward):** `@repo/shared`, `@repo/auth`, `@repo/tos-signer-base`, `@repo/acs-client`, `@repo/airdrop-base`, `@repo/chain-evm-kit`, `@repo/chain-solana-kit`, `@repo/airdrop-evm`, `@repo/airdrop-solana`, `@repo/components`, `@repo/ui`.

**Consumed by (upward):**

- `@repo/console-app-shared` — depends downward (the A2 rule); uses `chain/`, `claim/hooks`, `auth`, `organizations`, `providers`, `lib`.
- `apps/vesting-console`, `apps/airdrop-console` — composition roots, providers, auth flows, wallet-control, org switching.
- `apps/vesting-portal` — auth, claim hooks, org gate, providers.
- `apps/superadmin` — auth, providers, org primitives.

## Boundary — what belongs here, what does NOT

- ✅ App-flow orchestration: providers, auth login/logout, org resolution, wallet-control, chain client plumbing, claim hook facades.
- ✅ The single home for generic chain primitives: `confirmTx`, `useConfirmTx`, `useChainClients`, supported-chains catalog, `getTransactionExplorerLink`.
- ✅ Composition-root building blocks (`ProviderStack`, `OrgListBridge`, `AuthSideEffects`, `TosSignerHosts`). No single `AppRoot` god component — apps compose from parts.
- ❌ **No pure, domain-agnostic primitives** — those belong in `@repo/shared`, `@repo/auth`, `@repo/acs-client`, or a chain kit.
- ❌ **No console-product domain logic** (configurations, deploy, batches, funding, relayer, import) — that is `@repo/console-app-shared`'s territory.
- ❌ **No upward import** — must never import from `@repo/console-app-shared` or any `apps/*`.
- ❌ **No cross-chain bodies inside a single hook** — dual-chain claim hooks dispatch via chain-dispatch pattern (facade + `-evm` / `-solana` leaves); inline `isSolana` branching is the anti-pattern.
- ❌ **No branded domain widgets** — those live in `@repo/components`.

## Public surface

| Subpath              | What it exposes                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `./app`              | `ProviderStack`, `OrgListBridge`, `AuthSideEffects`, `TosSignerHosts` / `EvmTosHost` / `SolanaTosHost` — root composition parts                                                |
| `./chain`            | `useChainClients`, `resolveChainClients`, `confirmTx`, `useConfirmTx`, `ALL_KNOWN_CHAINS`, `getSupportedChain`, `chainDisplayName`, `getTransactionExplorerLink`, client types |
| `./claim/hooks`      | Five chain-dispatch claim hook facades + `ClaimHookResult` type                                                                                                                |
| `./providers`        | `useRouteScope`, `RouteScope`; re-exports `./providers/chains` and `./providers/data`                                                                                          |
| `./providers/chains` | `EvmProvider`, `SolanaRootProvider`, `ensureAppKit` (AppKit init)                                                                                                              |
| `./providers/data`   | `QueryProvider`, `AcsProvider`                                                                                                                                                 |
| `./auth`             | `useLogin`, `useLogout`, inspect/success/error-bridge hooks, auth-gating components, login UI components, `sanitizeNext`, `isCancelled`                                        |
| `./organizations`    | `OrgListProvider`, `useOrgList`, org-resolution hooks, `OrganizationGate`, switcher modal + avatar, recency hooks                                                              |
| `./wallet-control`   | `WalletControl` (dual-chain wallet UI component)                                                                                                                               |
| `./lib`              | `useApiBaseUrl` / override, `runtimeEnv`, `evmRole` / `solRole` / `role`, `UNKNOWN_TOKEN_SYMBOL`, `getShareXLink`                                                              |
| `./env`              | `runtimeEnv`, `RuntimeEnv` (typed `import.meta.env` runtime config)                                                                                                            |

## Invariants / red lines

- **A2 rule.** This package is the base shared layer. `@repo/console-app-shared` depends on it downward — never the reverse.
- **Chain-dispatch rule.** When a hook varies by chain, the public export is a facade; per-chain arms are internal `-evm.ts` / `-solana.ts` leaves. No inline both-chain bodies.
- **Chain SDK confinement.** `wagmi` / `@reown/*` may only appear in EVM leaf files and chain-kit imports. `@solana/*` only in Solana leaf files and chain-kit imports. The chain kits remain the only packages that own chain SDK code wholesale.
- **`resolveChainKind` is the single classification point.** Never ad-hoc chainId/address sniffing to distinguish EVM from Solana.
- **No `Buffer` global.** Never use bare `Buffer`; use `@repo/shared` byte helpers or `import { Buffer } from 'buffer'` when a dep requires it (Beet). The global leaks in Vite dev via AppKit pre-bundle but disappears in Rolldown prod builds.
