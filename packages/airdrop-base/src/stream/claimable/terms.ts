import type { ChainKind } from "@repo/acs-client/model"

/**
 * Types for the claimable twin. `StreamTerms` is the economic shape of an
 * on-chain `Stream` (the same fields both lock programs store) and carries an
 * explicit `chainKind` selecting the vesting algorithm — `wad` is not a field;
 * it is derived from `chainKind` via `scale.wadFor` inside the leaf engines,
 * so a caller can never silently select the wrong curve.
 */

/** Vesting phase at `now`. */
export type StreamPhase = "before_start" | "cliff" | "vesting" | "complete"

/**
 * Stream parameters the calc operates on. Times are unix seconds; `amount` is raw
 * smallest-unit (wei / lamports); percentages are already at the chain's wad scale.
 */
export interface StreamTerms {
  /** EXPLICIT chain discriminator selecting the vesting algorithm (analysis M1). */
  chainKind: ChainKind
  startTime: bigint
  cliffTime: bigint
  endTime: bigint
  amount: bigint
  startUnlockPercentage: bigint
  cliffUnlockPercentage: bigint
  /** 256-bit encoded: bit[64]=mode (0=interval/1=calendar), bits[0..63]=u64 interval. */
  pieceDuration: bigint
}

export interface ClaimableResult {
  /** Total unlocked at `now`, gross of prior claims (== on-chain `calculateClaimableAmount`). */
  totalUnlocked: bigint
  /** `totalUnlocked - claimed`, floored at 0. */
  claimable: bigint
  phase: StreamPhase
}
