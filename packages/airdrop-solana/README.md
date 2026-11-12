# @repo/airdrop-solana

Clique Solana program clients for the MerkleDistributor and CliqueLock programs: contracts, query factories, React hooks, and query keys.

## Responsibility

Owns everything specific to the Clique Solana on-chain programs (MerkleDistributor + CliqueLock):

- **Generated program bindings** — IDL-derived instruction builders and account decoders for both programs.
- **Contract functions** — `distributorClaim`, `lockHookClaim`, `revokeStream`, preset readers, and the Clique-error-aware `sendTransaction` / `confirmTransaction` wrappers (inject `resolveCliqueProgramError` so callers never thread the resolver themselves).
- **Query / mutation factories** — `queryOptions` and `mutationOptions` factories for all distributor + lock reads and writes. React-free; hooks consume them.
- **React hooks** — `useDistributor`, `useClaimedInfo`, `useMerkleRoot`, `useConfigurators`, `usePenalty`, `useClaimStatusPda`, `useStreamPreset`, `useStream`, `useClaimableAmount`, `useRevokeStream`.
- **Query key registry** — `airdropSolanaKeys`: chain-aware hierarchical keys for all Clique program entities (distinct from generic token/tx keys in `@repo/chain-solana-kit`).
- **Program error maps** — Anchor error-code → human-readable message for both programs, injected into the kit's generic error formatter via DI.

## Layer & positioning

```
@repo/airdrop-solana          ← this package
  ↑ consumed by
    @repo/airdrop-app-shared  (claim hooks — -solana.ts leaves)
    @repo/console-app-shared  (deploy engine, funding, project summary — -solana.ts leaves)
    apps/vesting-console       (-solana.ts leaf files)
    apps/airdrop-console       (-solana.ts leaf files)
    apps/vesting-portal        (-solana.ts leaf files)
  ↓ depends on
    @repo/chain-solana-kit    (wallet/tx/client primitives, error formatter, ProgramErrorResolver DI seam)
    @repo/airdrop-base        (product vesting math, schedule presets, fee-codec)
    @repo/acs-client          (chain classification, ACS wire model)
    @repo/shared              (generic utils)
    @solana/kit, @solana-program/*  (Solana runtime)
```

`@repo/airdrop-evm` is the symmetric EVM counterpart; the two never import each other.

## Boundary — what belongs here, what does NOT

- ✅ Clique program (MerkleDistributor + CliqueLock) instruction builders and account decoders
- ✅ Query / mutation factories and React hooks for those programs
- ✅ `airdropSolanaKeys` key registry (Clique-specific; generic keys stay in the kit)
- ✅ Clique Anchor error-code maps + the DI-injected `resolveCliqueProgramError`
- ✅ `sendTransaction` / `confirmTransaction` wrappers that bake in the Clique error resolver
- ❌ Generic Solana wallet, RPC, token, or explorer utilities — those belong in `@repo/chain-solana-kit`
- ❌ Any EVM code or EVM imports (`wagmi`, `viem` contract calls) — single-chain boundary; EVM lives in `@repo/airdrop-evm`
- ❌ ACS HTTP calls or product-level business logic — that belongs in `@repo/acs-client` / `@repo/airdrop-base`
- ❌ App-flow orchestration (claim flows, deploy flows, modal state) — that belongs in `@repo/airdrop-app-shared` or `@repo/console-app-shared` above
- ❌ Both-chain dispatch logic — chain dispatch facades (naming both EVM and Solana) live at the app-shared layer, not here

## Public surface

| Subpath       | Exports                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `./contracts` | Pure program clients: MerkleDistributor + CliqueLock instruction builders, account readers, and the Clique-error-aware `sendTransaction` / `confirmTransaction` wrappers |
| `./query`     | React-free `queryOptions` / `mutationOptions` factories for all distributor + lock operations; `airdropSolanaKeys`                                                       |
| `./react`     | `use*` hooks (distributor reads + claim mutations, lock reads + revoke mutation)                                                                                         |
| `./keys`      | `airdropSolanaKeys` key registry directly (for consumers that need keys without the full query surface)                                                                  |

## Invariants / red lines

- **Single-chain boundary.** Only `@solana/*` SDKs are imported here. `wagmi` / `viem` contract calls are forbidden. The only allowed cross-chain reference is `@repo/acs-client` for chain classification.
- **DI, not global injection.** `resolveCliqueProgramError` is injected into the kit's `walletTx.send` / confirm via the `ProgramErrorResolver` seam — it is never patched globally. `sendTransaction` and `confirmTransaction` are the single convergence point.
- **Keys are chain-aware.** `airdropSolanaKeys` puts `chain` immediately after the hook tag so prefix invalidation can target one cluster without flushing all clusters.
- **ToS hooks are NOT re-exported.** `useEnsureToSSigned` lives in `@repo/chain-solana-kit`; consumers import it from there directly.
- **No app-flow.** This package contains primitives (contracts, queries, hooks). Claim flows, deploy sequences, and modal orchestration belong one layer up.
