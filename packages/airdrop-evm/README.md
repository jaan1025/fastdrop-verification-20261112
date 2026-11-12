# @repo/airdrop-evm

EVM-specific Clique contract clients for the distributor, lock, lock-hook, and hook variants — contracts, query factories, React hooks, and query keys.

## Responsibility

Owns all interaction with Clique EVM smart contracts: ABI-typed read/write functions, TanStack Query `queryOptions`/`mutationOptions` factories, thin React hooks that consume those factories, a hierarchical query-key registry (`airdropEvmKeys`), and the revert-decode ABI registry (`DEFAULT_ERROR_ABIS`) used as a DI seam by every EVM write/claim path. Contract families covered: distributor, lock (CliqueLock), lock-hook (CliqueLockHook), linear-penalty-hook, transfer-hook, transfer-with-cap-hook, transfer-or-coin-flip-hook.

## Layer & positioning

Sits directly above `@repo/chain-evm-kit` (generic EVM wallet/tx primitives) and the product math layer (`@repo/airdrop-base`, `@repo/acs-client`, `@repo/shared`). It is the lowest layer that knows Clique contract ABIs.

**Depends on (downward):**

- `@repo/chain-evm-kit` — `sendTransaction`, `confirmTransaction`, `EvmTxHandle`, wallet/ToS hooks
- `@repo/airdrop-base` — product math (fee-codec, schedule, claimable)
- `@repo/acs-client` — ACS wire model, chain classification
- `@repo/shared` — generic utils

**Consumed by (upward):**

- `@repo/airdrop-app-shared` — claim facades (`use-distributor-claim-{admin,portal,paymaster}-evm`, `use-lock-claim-*-evm`)
- `@repo/console-app-shared` — project-status, funding overview, fee, batch-sync, trigger-claim EVM leaves

## Boundary — what belongs here, what does NOT

- ✅ Clique EVM contract ABI definitions, typed read/write functions
- ✅ `queryOptions` / `mutationOptions` factories for each contract family (React-free)
- ✅ Thin `use*` hooks that wrap those factories (hooks only — no UX side-effects)
- ✅ The `airdropEvmKeys` query-key registry
- ✅ `DEFAULT_ERROR_ABIS` revert-decode registry (DI seam for write/claim callers)
- ✅ `sendTransaction` / `confirmTransaction` re-exported from the kit with Clique ABI injection
- ❌ No Solana imports or any dual-chain code — this is a single-chain (EVM) leaf
- ❌ No `wagmi` / `@reown/*` direct imports — those live inside `@repo/chain-evm-kit`; this package uses the kit's facades
- ❌ No app-flow orchestration (claim flows, modal state, resume logic) — that belongs in `@repo/airdrop-app-shared` or higher
- ❌ No ACS HTTP calls or product-level business logic — those live in `@repo/acs-client` / `@repo/airdrop-base`
- ❌ No UI components or domain widgets

## Public surface

| Subpath       | Exposes                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `./contracts` | ABI-typed contract functions for all families; `sendTransaction`, `confirmTransaction`, `EvmTxHandle` |
| `./query`     | `queryOptions` / `mutationOptions` factories and their data/key/param types; `airdropEvmKeys`         |
| `./react`     | Named React hook exports only (`use*`) and their parameter types                                      |
| `./keys`      | `airdropEvmKeys` query-key registry (also re-exported from `./query`)                                 |

## Invariants / red lines

- **Single-chain boundary.** This package is EVM-only. It must never import `@solana/*`, `@repo/chain-solana-kit`, or `@repo/airdrop-solana`. The only code allowed to reference both chains is a dispatcher or app composition root above this layer.
- **Chain SDK confinement.** `wagmi` and `@reown/*` are peer dependencies consumed through `@repo/chain-evm-kit` facades — never imported directly here.
- **`DEFAULT_ERROR_ABIS` is a shared DI contract.** Out-of-package callers (e.g. `airdrop-app-shared` claim facades) must use this registry to guarantee byte-stable revert decoding — do not duplicate or inline the ABI list at call sites.
- **Hooks-only in `./react`.** The `./react` subpath is a curated named-export list. Only `use*` hooks and their parameter types belong there; `queryOptions` factories and data types belong in `./query`.
