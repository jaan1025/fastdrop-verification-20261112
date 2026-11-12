// Root barrel — the curated public surface of the headless ToS-signer base.
// Exposes the one matched-pair factory, its public types, the dialog slot
// contract, and the reusable scroll-gate hook. The channel token, host machine
// internals, store hook, and emitter/ensure factories are NOT re-exported
// (private — reached only through the matched set returned by `createToSSigner`).
// No `"./*"` wildcard, no `export *` wall (L5/§2.9).
export { createToSSigner } from "./factory"

export { useScrolledToBottom } from "./dialog"
export type { ToSDialogProps } from "./dialog"

export type {
  SigningOptions,
  ToSSignerConfig,
  ToSSigner,
  ResolveStorageKey,
  EnsureToSSignedConfig,
  // `EnsureToSSignedDeps` (= Omit<EnsureToSSignedConfig,'signToS'>) is public
  // because it appears in the inferred signature of `ToSSigner.useEnsureToSSigned`:
  // a consumer that re-exports a `ToSSigner` member (e.g. the chain kits'
  // `useEnsureToSSigned`) must be able to name the derived type (TS2883).
  // `EnsureToSSignedMatched` is the sibling matched-wiring contract co-located
  // with it. Both sit next to their base `EnsureToSSignedConfig`.
  EnsureToSSignedDeps,
  EnsureToSSignedMatched,
  EnsureToSSignedParams,
  EnsureToSSignedResult,
  ToSSignerHostState,
  ToSSignatureStore,
} from "./types"
