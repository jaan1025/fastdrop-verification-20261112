import type { UnlockSplit } from "./phases"

/**
 * [golden-test] The EVM arm of the claimable twin: the raw-seconds post-cliff
 * vested-portion engine (bit-for-bit mirror of
 * `CliqueLock.calculateClaimableAmount`). EVM genuinely lacks calendar logic
 * on-chain — `pieceDuration` is a raw integer second-count divisor, so a
 * calendar preset's huge encoded value just makes `pieces = 0` until `endTime`.
 * Do NOT add a mode-1 branch. A sanctioned dual-format contract; never merged
 * with the Solana arm.
 *
 * `evmVestedPortion` is reached only through the `claimable.ts` facade.
 */

/**
 * EVM post-cliff vested portion. Truncating integer division, multiply-before-
 * divide, and `totalPieces` rounded UP (`+1` when `vestingDuration % pieceDuration`
 * is non-zero). Bit-for-bit mirror of `CliqueLock.calculateClaimableAmount`.
 */
export function evmVestedPortion(
  split: UnlockSplit,
  elapsedTime: bigint,
  vestingDuration: bigint,
  pieceDuration: bigint,
): bigint {
  const { vestingPool } = split
  // pieceDuration == 0 → linear (CliqueLock.sol L229-231).
  if (pieceDuration === 0n) {
    return (vestingPool * elapsedTime) / vestingDuration
  }
  // pieceDuration != 0 → piecewise (CliqueLock.sol L234-242). Step-snap (the
  // `pieces`/`totalPieces` division) precedes the multiply.
  const pieces = elapsedTime / pieceDuration
  const totalPieces =
    vestingDuration % pieceDuration === 0n
      ? vestingDuration / pieceDuration
      : vestingDuration / pieceDuration + 1n
  return totalPieces > 0n ? (vestingPool * pieces) / totalPieces : 0n
}
