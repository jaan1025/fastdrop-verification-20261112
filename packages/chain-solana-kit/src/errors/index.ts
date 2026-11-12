// `errors/` domain — Solana arm. Two-layer shape, symmetric with the EVM kit:
//   • `decode.ts` — raw simulation logs / error codes → the failing error
//                   (`parseAnchorErrorFromLogs`, `parseProgramErrorFromLogs`) +
//                   the injected `ProgramErrorResolver` DI seam.
//   • `format.ts` — error / RPC-response → USER MESSAGE (`formatRpcError`,
//                   `formatError`, `toUserError`). Depends on `decode.ts`.
// (The EVM kit mirrors this: `errors/decode.ts` extracts structured data,
// `errors/format.ts` produces the message.)
//
// Roles that line up across the two kits:
//   1. (error)->message     — `formatRpcError` / `formatError`
//                             / `toUserError` ↔ EVM `formatError` / `toUserError`
//   2. DI seam (injected)   — `ProgramErrorResolver` (a `(addr,code)→msg` fn that
//                             `@repo/airdrop-solana` composes) ↔ EVM `ErrorAbis`
//   3. catalogs             — `SolanaErrorMessages` + the SPL-token map ↔ EVM `GENERIC_ERROR_ABIS`
//
// The kit ships only the generic SPL resolver; Clique per-program Anchor maps
// live in `@repo/airdrop-solana` and are injected at the seam — keeping this
// package free of any contracts-package import.
export { formatRpcError, formatError, toUserError } from "./format"
export { type ProgramErrorResolver } from "./decode"
export { SPL_TOKEN_ERRORS, SPL_TOKEN_PROGRAM_ADDRESSES, resolveSplTokenError } from "./spl-errors"
export { SolanaErrorMessages } from "./messages"
