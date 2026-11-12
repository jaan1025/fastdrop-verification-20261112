// `errors/` domain — EVM arm. Two-layer shape, symmetric with the Solana kit:
//   • `decode.ts` — raw viem error / calldata → STRUCTURED `{errorName, args}`.
//   • `format.ts` — structured / caught error → USER MESSAGE (`formatError`,
//                   `toUserError`) + the post-mining re-sim path. Depends on
//                   `decode.ts`; never the reverse.
// (Solana mirrors this: `errors/decode.ts` parses logs/codes, `errors/format.ts`
// produces the message.)
//
// Roles that line up across the two kits:
//   1. (error)->message     — `formatError` / `toUserError`
//                             ↔ Solana `formatError` / `toUserError`
//   2. DI seam (injected)    — `ErrorAbis` (the candidate ABIs `@repo/airdrop-evm`
//                             composes into `DEFAULT_ERROR_ABIS`)
//                             ↔ Solana `ProgramErrorResolver`
//   3. catalog               — `GENERIC_ERROR_ABIS` ↔ Solana SPL/message maps
//
// The EVM seam is DATA-shaped (a list of ABIs) where Solana's is FUNCTION-shaped
// (a resolver) — intrinsic (EVM decodes revert calldata; Solana maps (program,code)
// log strings). `catchRevert` is the EVM-only throwing shell
// (EVM decode happens at the write call site). The kit ships no Clique default; it
// lives in `@repo/airdrop-evm`, composed from `GENERIC_ERROR_ABIS`.
export { catchRevert } from "./catch"
export { formatError, toUserError } from "./format"
export { GENERIC_ERROR_ABIS, type ErrorAbis } from "./abis"
