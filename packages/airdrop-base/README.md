# @repo/airdrop-base

The chain-free contract-domain library of the Clique airdrop/vesting protocol —
the byte-exact math/encoding twins of the two on-chain programs, the product
identity grammars that key on-chain slots, and the schedule-authoring DSL that
lowers to on-chain parameters. Nothing else: display/view-model logic lives with
its consumers (`@repo/components/schedule-display`,
`@repo/airdrop-app-shared/stream-position`, app-local resolvers).

## The on-chain system it mirrors

Two programs per chain, structurally identical across EVM
(`../clique-lock/src`) and Solana (`../clique-lock-svm/programs`):

- **Lock** (`CliqueLock.sol` / `clique-lock`) — a standalone stream escrow.
  Entity: **Stream** (amount, claimed, start/cliff/end, start/cliff unlock %,
  pieceDuration). It knows nothing of presets, roots, strategies, or fees.
- **Distributor** (`BaseDistributor`+`Distributor` / `merkle-distributor`) —
  the merkle+signature claim gate composing weighted strategies
  (Transfer / Lock / Penalty) over per-configurator config space. The
  **StreamPreset, PenaltyConfig, and BatchConfig are distributor-side assets on
  both chains** (CliqueLockHook contract / distributor-program PDAs).

## Families & dependency law

```
scale        chain scale table (WAD 1e18 / 1e9 / bps) + percent converters
stream       the Stream object mirror: claimable-curve twin (dual arms),
             raw pieceDuration codec, recovered-revocation truth shape
distributor  merkle allocation kernel, configurator identity, ACS batch
             conventions, configuration-code grammar, StreamPreset
             (wire + normalize + sentinel + preset→StreamTerms lowering), fee codec
schedule     the product authoring DSL: ScheduleInput vocabulary, deriveSchedule,
             the scheduleCode grammar, protocol-exact interval/seconds math,
             the two duration-lowering models, preset→Schedule read projection
```

**Law (machine-enforced by `scripts/check-chain-boundaries.ts`):**
`scale → ∅` · `stream → scale` · `distributor → stream + scale` ·
`schedule → distributor + stream + scale`. No exceptions.

## Doors

| Subpath                                                                            | Exposes                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./stream`                                                                         | `calculateClaimableAmount` (the contract's own name) + `StreamTerms` / `ClaimableResult` / `ClaimablePhase`, raw pieceDuration codec (`decodePieceDuration`, `pieceDurationFromSolanaBytes`), `StreamRevocationInfo`                                                                                                                                                                                                                   |
| `./distributor`                                                                    | merkle kernel (`computeMerkleRoot`, `deriveHandlerHash`), configurator identity (`expectedConfigurators`, `configuratorsMatch`), ACS batch conventions (`isBatchRevoked`, `resolveBatchStatus`, `resolveBatchScheduleCode`), configuration-code grammar, StreamPreset (`normalize*StreamPreset`, `flexibleStartSentinel`, `streamTermsFrom*Preset`, wire types), fee codec (`encodeFeeMode`, `formatBatchFeeConfig`, `BatchFeeConfig`) |
| `./schedule`                                                                       | `ScheduleInput` / `TimeUnit` / `UnlockInterval` / `Schedule`, `deriveSchedule`, scheduleCode grammar (`deriveScheduleCode`, `hashScheduleCode`, `scheduleCodeHashBytes`), DSL↔pieceDuration bridge (`encodePieceDuration`, `pieceDurationToInterval`), interval/seconds math + form rules, `presetToSchedule` / `presetLockAddress` / `isPresetDeployed`                                                                               |
| `./scale`                                                                          | WAD/BPS/percent dual-scale substrate (`WAD_EVM` 1e18 / `WAD_SOL` 1e9 — never collapse)                                                                                                                                                                                                                                                                                                                                                 |
| `./schedule/duration-model/fixed-span`, `./schedule/duration-model/calendar-month` | The two duration-lowering models (airdrop = fixed 30/90/365-day spans, mode-0; vesting = calendar months, mode-1) as separate doors so a caller locks all three outputs to ONE model                                                                                                                                                                                                                                                   |

## Layer & positioning

```
@repo/shared          (zero-dep utils)
@repo/acs-client      (wire model, chain classification, scheduleCode wire grammar)
    ↓
@repo/airdrop-base    ← HERE
    ↓
@repo/airdrop-evm / @repo/airdrop-solana   (per-chain contract clients)
@repo/components                            (branded widgets + schedule-display)
@repo/airdrop-app-shared                    (app-flow orchestration + stream-position + claim)
@repo/console-app-shared                    (console domain logic)
apps/*
```

**Depends on (downward only):** `@repo/acs-client`, `@repo/shared`, `viem`, `date-fns`.

> `@repo/acs-client` is a **downward** dependency, not a consumer — it models the
> `scheduleCode` wire field but deliberately does NOT import the keccak grammar
> (a two-package boundary).

## Boundary — what belongs here, what does NOT

- ✅ Pure, chain-free computations mirroring or keying the on-chain system
- ✅ Deliberately frozen dual-format arms (EVM/Solana) that ship whole and
  co-located — product-semantic contracts, not technical debt
- ✅ Byte-critical keccak/hash outputs that are idempotency keys
- ❌ **No chain SDK imports** — no `wagmi`, `@solana/*`, `@reown/*`
- ❌ **No display/view-model logic** — status label maps, metrics assembly,
  formatting, chart geometry live with their consumers
- ❌ **No app-flow orchestration, no HTTP, no UI code**
- ❌ **No "cleaning up" the frozen dual-format arms** — EVM raw-seconds vs
  Solana calendar, WAD 1e18 vs 1e9, EVM ceil-totalPieces vs Solana
  exact-multiple are deliberate divergences; do not unify

## Invariants / red lines

- **Byte-critical outputs.** `deriveScheduleCode` and `deriveConfigurationCode`
  (keccak) are idempotency keys the on-chain preset/penalty slots are addressed
  by; merkle leaf/root bytes, fee encode strings, `expectedConfigurators`,
  `flexibleStartSentinel`, and the claimable twin are all golden-pinned. Any
  encoding change is BREAKING — re-pin goldens first.
- **Family law** above; the boundary script fails the build on violation.
- **Frozen dual-format.** `stream/claimable/claimable-{evm,solana}.ts` and
  `distributor/fee/fee-codec-{evm,solana}.ts` ship whole as matched pairs.
- **No upward imports.** Never import `@repo/airdrop-app-shared`,
  `@repo/console-app-shared`, `@repo/components`, or `apps/*`.
- **Chain-SDK-free.** `-evm.ts` / `-solana.ts` leaves perform pure computation
  only.
