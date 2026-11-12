# @repo/tos-signer-base

Chain-agnostic, headless ToS consent-and-sign primitives: a matched-pair factory, a pure state machine, a payload-aware local cache, and the dialog-slot contract.

## Responsibility

Owns the complete, chain-free lifecycle of a Terms-of-Service consent-and-sign cycle:

- **Matched-pair factory** — `createToSSigner(config)` mints one private channel and wires the emitter hook, headless host hook, ensure orchestrator, and cache store into a single matched set. Each chain SDK calls it exactly once; chain dispatch is by instantiation, not an inline branch.
- **Private channel** — a process-unique string token (via `@repo/shared/event`) links emitter ↔ host by construction, eliminating the legacy stringly-typed `eventName` convention.
- **Host state machine** — a pure (zero-React, zero-I/O) reducer over `idle → prompting → signing → idle`; unit-testable without rendering.
- **Payload-aware cache** — `resolveStorageKey` derives stable localStorage keys from `(address, identifier, payload?)`. Lowercases for EVM; leaves Solana base58 verbatim. Key derivation is golden-tested — cached consents must survive refactors.
- **Dialog-slot contract** — `ToSDialogProps` is the pure-type interface any consent surface must satisfy; this package carries no UI, no `@repo/ui`, no `react-markdown`.

## Layer & positioning

```
@repo/shared          ← async event bus, matchUnion
@repo/acs-client      ← ACS public-client config (appId default in ensure hook)
     ↑
@repo/tos-signer-base          ← THIS PACKAGE (chain-agnostic headless layer)
     ↑
@repo/chain-evm-kit            ← instantiates createToSSigner once (EVM config)
@repo/chain-solana-kit         ← instantiates createToSSigner once (Solana config)
     ↑
@repo/airdrop-app-shared       ← mounts the host components (tos-signer-hosts.tsx)
@repo/components               ← ToSDialog (the concrete consent UI, implements ToSDialogProps)
apps/*                         ← consume the matched sets through the chain kits
```

Direct upstream consumers found in the codebase:

- `packages/chain-evm-kit/src/react/tos-signer/signer.ts` and `host.tsx`
- `packages/chain-solana-kit/src/react/tos-signer/signer.ts`, `host.tsx`, `index.ts`
- `packages/airdrop-app-shared/src/app/tos-signer-hosts.tsx`
- `packages/components/src/tos-dialog/tos-dialog.tsx` (slot contract)

## Boundary — what belongs here, what does NOT

- ✅ Chain-agnostic consent/sign lifecycle (prompt → confirm/cancel → sign → cache)
- ✅ Pure state machine (`tosHostReducer`) with no React or I/O dependency
- ✅ Payload-aware localStorage cache with golden-tested key derivation
- ✅ Private channel factory (matched emitter ↔ host by construction)
- ✅ `ToSDialogProps` slot contract (pure type; zero UI)
- ✅ `useScrolledToBottom` scroll-gate hook (generic, headless)
- ❌ No chain SDK imports (`wagmi`, `@solana/*`, `viem` signing) — chain-specific `signMessage` is injected via config
- ❌ No UI components, no `@repo/ui`, no `react-markdown` — the concrete dialog lives in `@repo/components`
- ❌ No domain code (no ACS wire types, no product logic beyond appId defaulting)
- ❌ No upward imports — must not import `@repo/chain-evm-kit`, `@repo/chain-solana-kit`, or anything above in the layer stack

## Public surface

| Export        | What it exposes                                                                                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.` (default) | `createToSSigner` factory; `ToSDialogProps` slot contract; `useScrolledToBottom` scroll-gate hook; all public types (`ToSSigner`, `ToSSignerConfig`, `SigningOptions`, `ResolveStorageKey`, `EnsureToSSignedConfig/Deps/Matched/Params/Result`, `ToSSignerHostState`, `ToSSignatureStore`) |

## Invariants / red lines

- **Golden-tested cache keys.** `resolveStorageKey` derivation is pinned by golden vectors (EVM-lowercased and Solana-verbatim forms). Do not change the key formula without updating the golden tests — cached consents must survive refactors.
- **One host per matched set.** Each `createToSSigner` call mints exactly one private channel. Mounting more than one host hook for the same matched set will race — the contract is one emitter ↔ one host per `ToSSigner` instance.
- **Chain dispatch by instantiation, not branching.** Adding a new chain means one `createToSSigner(config)` call with a chain-specific `signMessage`; no file in this package is edited. Inline `isEvm`/`isSolana` checks inside this package are the anti-pattern.
- **Headless by charter.** This package must remain importable in test environments without a DOM or wallet provider. No `@repo/ui`, no chain SDK, no router.
