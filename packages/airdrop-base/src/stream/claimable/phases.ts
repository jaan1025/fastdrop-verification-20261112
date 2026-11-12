import { wadFor } from "../../scale"
import type { StreamPhase, StreamTerms } from "./terms"

/**
 * The CHAIN-FREE part of the claimable twin: the phase branch (before_start /
 * cliff / vesting / complete) and the start/cliff unlock pool math, identical on
 * both chains. Only the post-cliff *vested portion* differs per chain (that lives
 * in the leaves). The phase shape is identical on EVM and Solana; keeping it here
 * means the phase logic has one home and the leaves carry only the divergent math.
 */

/** The one-time split of the stream amount into its unlock components. */
export interface UnlockSplit {
  /** `amount × startUnlockPercentage / wad`. */
  startUnlockAmount: bigint
  /** `amount × cliffUnlockPercentage / wad`. */
  cliffUnlockAmount: bigint
  /** `amount − startUnlock − cliffUnlock` (the portion the leaf vests). */
  vestingPool: bigint
}

/** The shared phase branch on the three timestamps (chain-free). */
export function resolvePhase(stream: StreamTerms, now: bigint): StreamPhase {
  if (now < stream.startTime) return "before_start"
  if (now >= stream.endTime) return "complete"
  if (now < stream.cliffTime) return "cliff"
  return "vesting"
}

/**
 * Derives the start/cliff unlock amounts + the remaining vesting pool using
 * `wadFor(stream.chainKind)`; the shared pre-vesting math the leaves consume.
 */
export function deriveUnlockSplit(stream: StreamTerms): UnlockSplit {
  const wad = wadFor(stream.chainKind)
  const startUnlockAmount = (stream.amount * stream.startUnlockPercentage) / wad
  const cliffUnlockAmount = (stream.amount * stream.cliffUnlockPercentage) / wad
  const vestingPool = stream.amount - startUnlockAmount - cliffUnlockAmount
  return { startUnlockAmount, cliffUnlockAmount, vestingPool }
}
