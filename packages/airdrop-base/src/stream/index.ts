// Curated barrel for the `@repo/airdrop-base/stream` subpath — the STREAM
// family: the chain-free mirror of the clique-lock programs' Stream object.
// The claimable-curve twin (dual EVM/Solana arms behind the facade), the raw
// pieceDuration codec, and the recovered-revocation truth shape. Composes
// `scale` only.

export { calculateClaimableAmount } from "./claimable"
export type { StreamTerms, ClaimableResult, StreamPhase } from "./claimable"

export { decodePieceDuration, pieceDurationFromSolanaBytes } from "./piece-duration"
export type { DecodedPieceDuration } from "./piece-duration"

export type { StreamRevocationInfo } from "./revocation"
