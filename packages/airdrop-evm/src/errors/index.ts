// Clique error injection — the contracts side of the kit's revert-decode DI
// seam (mirrors `airdrop-solana/src/errors/`). The kit's `sendAndConfirm` /
// `confirmTransaction` / `catchRevert` all accept an `errorAbis`; this module
// owns the Clique ABI registry and the package's `transaction/{send,confirm}`
// bake it in, so callers never thread it. Package-internal (no door) — external
// composers reach the baked `sendTransaction`/`confirmTransaction` via
// `./contracts` instead of importing the registry.
export { DEFAULT_ERROR_ABIS } from "./default-error-abis"
