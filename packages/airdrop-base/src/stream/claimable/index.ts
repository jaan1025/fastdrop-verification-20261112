// Internal barrel for the stream claimable family (chain-dispatch folder).
// The leaf vested-portion engines (`claimable-evm.ts` / `claimable-solana.ts`)
// stay private behind the facade; only the terms builders + facade + types are
// re-exported. The dual arms are a sanctioned dual-format contract — never
// unified.

export { calculateClaimableAmount } from "./claimable"
export type { StreamTerms, ClaimableResult, StreamPhase } from "./terms"
