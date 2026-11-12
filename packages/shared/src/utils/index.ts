// Sub-barrel for `@repo/shared/utils` — the curated pure-utility surface. No
// `client`/`event`/`state`/`hooks` re-exports leak in here (those are separate
// subpaths) so pure-util consumers stay free of `axios`/`jotai`/`react`.

// Rust-like exhaustive match over a discriminated union (`{ kind }`)
export * from "./match"

// Deterministic big-endian bytes32 comparator (merkle sorting)
export * from "./bytes"

// Number / bigint formatting + parsing
export * from "./number"

// Recursive object key-case transforms
export * from "./case-deep"

// Scalar string transforms (+ word-split / case conversion)
export * from "./string"

// Pure type-guard predicates (isNil, isPlainObject)
export * from "./predicate"

// bigint-safe JSON stringification
export * from "./json"

// UTC-pinned date parsing + formatting
export * from "./date"

// UTC calendar arithmetic (add N units)
export * from "./duration"

// Chain-agnostic address display helpers
export * from "./address"

// Single SSR-guard home
export * from "./env"

// Client env (`VITE_*`) read-both + trim-to-undefined primitive
export * from "./client-env"

// Byte ⇄ hex/base64/utf8 family (+ Hex type)
export * from "./encoding"

// Async timing + retry primitives
export * from "./async"

// localStorage primitive + cache alias
export * from "./storage"
