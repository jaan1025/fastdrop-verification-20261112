import { WAD_SOL } from "../../../scale"

/**
 * [contract-mirror] The Solana arm of the penalty curve — bit-for-bit mirror of
 * `penalty.rs::calculate_penalty_amount`: interpolate the WAD_SOL rate between
 * `startPenalty` and `endPenalty` (floor-divided BEFORE the add/subtract,
 * operator order pinned to the contract), then apply `amount * rate / WAD_SOL`
 * (second floor). A deliberately DIFFERENT rounding shape from the EVM arm.
 */
export function solanaPenaltyAmount(
  amount: bigint,
  terms: {
    beginTime: bigint
    endTime: bigint
    startPenalty: bigint
    endPenalty: bigint
  },
  claimAt: bigint,
): bigint {
  return (amount * solanaPenaltyRateAt(terms, claimAt)) / WAD_SOL
}

/** The interpolated WAD_SOL penalty rate at `claimAt` (exported for terms display). */
export function solanaPenaltyRateAt(
  terms: {
    beginTime: bigint
    endTime: bigint
    startPenalty: bigint
    endPenalty: bigint
  },
  claimAt: bigint,
): bigint {
  const { beginTime, endTime, startPenalty, endPenalty } = terms
  if (claimAt < beginTime) return startPenalty
  if (claimAt >= endTime) return endPenalty

  const elapsed = claimAt - beginTime
  const totalDuration = endTime - beginTime

  if (startPenalty >= endPenalty) {
    // Penalty decreasing over time (common case: early = high penalty)
    const diff = startPenalty - endPenalty
    return startPenalty - (diff * elapsed) / totalDuration
  }
  // Penalty increasing over time
  const diff = endPenalty - startPenalty
  return startPenalty + (diff * elapsed) / totalDuration
}
