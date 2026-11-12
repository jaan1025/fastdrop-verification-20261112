# @repo/chain-solana-kit

Generic single-chain Solana wallet, transaction, token, and RPC client primitives — the exclusive home of all `@solana/*` SDK code in the monorepo.

## Responsibility

Owns every Solana-specific primitive that is not tied to a Clique contract/program:

- **Chain/cluster registry** — `SUPPORTED_SOLANA_CHAINS`, `SolanaNetwork`, cluster ↔ chainId resolvers, RPC endpoint resolution (endpoint injected, never embedded).
- **Transaction pipeline** — simulate → sign → send → confirm (`walletTx`, `confirm`, `simulate`, `ensureTxFits` LUT compression, `waitForMultisigExecution`).
- **Signing strategies** — wallet-standard `signMessage`, SquadsX commit-reveal, memo-tx hardware fallback; multisig/SquadsX wallet detection; user-rejection detection.
- **SPL token / Token-2022 helpers** — ATA derivation/creation, mint info, Metaplex metadata fetch, SOL/SPL formatting, native SOL transfer.
- **TOS signer** — Solana-side TOS message signing (`./tos-signer` subpath), built on `@repo/tos-signer-base`.
- **Query layer** — React-Query `queryOptions` / `mutationOptions` factories for token balance, mint info, vault ATA, account transactions, metadata, native/SPL transfers and approvals; `solanaKeys` hierarchical key factory.
- **React hooks** — `SolanaProvider`, `SolanaClientsProvider`, `SafeWalletSignersProvider`; wallet connect/disconnect/preflight hooks; token and native-balance hooks; `useGetTransactionExplorerLink`.
- **Low-level utilities** — byte/scale encoders, PDA helpers, compute-budget builder, LUT cache, error formatting with DI `ProgramErrorResolver`, RPC validation, logger seam.

## Layer & positioning

```
@repo/shared  ←  @repo/acs-client  ←  @repo/tos-signer-base
                                        ↑
                             @repo/chain-solana-kit   ←  @repo/airdrop-solana
                                                          @repo/airdrop-app-shared
                                                          @repo/console-app-shared
                                                          apps/*
```

**Depends on (downward):** `@repo/shared`, `@repo/acs-client`, `@repo/tos-signer-base`, `@repo/ui` (peer), `@solana/*` SDKs, `@sqds/multisig`, `@wallet-standard/*`.

**Consumed by (upward):**

- `@repo/airdrop-solana` — Clique distributor/lock program clients built on top of this kit.
- `@repo/airdrop-app-shared` — composition-root Solana providers, login/auth flow, wallet-control, chain-client resolution.
- `@repo/console-app-shared` — console-level Solana-side domain hooks.
- `apps/vesting-console`, `apps/airdrop-console`, `apps/vesting-portal`, `apps/superadmin`, `apps/pass` — app composition roots and `-solana.ts` leaf files.

## Boundary — what belongs here, what does NOT

- ✅ Any code that must `import` from `@solana/*`, `@solana-program/*`, `@sqds/multisig`, or `@wallet-standard/*`.
- ✅ Chain-generic Solana primitives: chain registry, tx pipeline, signing strategies, token helpers, RPC utilities, error formatters.
- ✅ Generic React providers and hooks for wallet connection, token reads, and transaction submission — with no knowledge of Clique contracts.
- ✅ TOS signer (Solana-specific signing strategy wrapping `@repo/tos-signer-base`).
- ❌ **No Clique contract/program code.** Distributor, lock-hook, and any program-specific IDL or instruction builders belong in `@repo/airdrop-solana`.
- ❌ **No EVM code, no `wagmi`/`@reown/*` imports, no import of `@repo/chain-evm-kit`.** These two kits never import each other.
- ❌ **No product/domain logic.** Vesting math, fee codec, schedule codes, batch status — those live in `@repo/airdrop-base` or higher.
- ❌ **No app-flow orchestration.** Claim flows, config-create engines, multi-step modal state — those belong in `@repo/airdrop-app-shared` or the apps.
- ❌ **No embedded RPC URLs.** Endpoints are always injected by the caller; the kit provides resolvers, not hardcoded endpoints.
- ❌ **No `@repo/acs-client` chain-classification calls re-implemented here.** `resolveChainKind`/`isEvmChainId`/`isSolanaChainId` are the single classification point in `@repo/acs-client`; this kit does not duplicate that logic.

## Public surface

| Subpath        | What it exposes                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./config`     | Chain/cluster registry (`SUPPORTED_SOLANA_CHAINS`, `SolanaNetwork`, `SolanaChain`), RPC factory re-exports (`createSolanaRpc`), cluster/endpoint resolvers, `isSolanaAddressStrict`.                                                                          |
| `./token`      | Pure SPL/Token-2022 helpers: ATA derivation/creation, mint info extraction, Metaplex metadata fetch, SOL/SPL amount formatting, native SOL transfer instruction.                                                                                              |
| `./tos-signer` | Solana TOS signer React host component and signer factory (built on `@repo/tos-signer-base`).                                                                                                                                                                 |
| `./utils`      | Low-level primitives: tx pipeline (`walletTx`, `confirm`, `simulate`, `ensureTxFits`), byte/scale encoders, compute-budget builder, PDA helpers, LUT cache, error formatters (`ProgramErrorResolver` DI), RPC validation, wallet-kind detection, logger seam. |
| `./query`      | React-Query `queryOptions`/`mutationOptions` factories for token balance, mint info, ATA, account transactions, metadata, native/SPL transfers; `solanaKeys` key factory. React-free.                                                                         |
| `./react`      | React providers (`SolanaProvider`, `SolanaClientsProvider`, `SafeWalletSignersProvider`), wallet connect/disconnect/preflight hooks, token and native-balance hooks, `useGetTransactionExplorerLink`. Consumes `./query` internally.                          |

## Invariants / red lines

- **`@solana/*` confinement.** This package and `-solana.ts` leaf files are the ONLY places in the monorepo allowed to import `@solana/*`, `@solana-program/*`, or `@sqds/multisig`. A boundary check (`node --experimental-strip-types scripts/check-chain-boundaries.ts`) enforces this.
- **Multisig / SquadsX LUT guard.** `ensureTxFits` short-circuits for multisig wallets and never creates on-the-fly ALTs (recent-slot ~3.4 min vs Squads proposal cycle). It only uses pre-provided LUTs. Do not remove this guard.
- **`Buffer` — never bare global.** Vite dev leaks `Buffer` via AppKit pre-bundling; Rolldown/prod drops it. Always `import { Buffer } from 'buffer'` when a dependency genuinely needs it. Do not rely on the global.
- **No chain-kind re-classification.** `resolveChainKind` / `isEvmChainId` / `isSolanaChainId` live in `@repo/acs-client` and are the single classification point. This kit does not re-implement them.
