import { decodePieceDuration } from "../piece-duration"
import type { UnlockSplit } from "./phases"

/**
 * [golden-test] The Solana arm of the claimable twin: the calendar-aware
 * post-cliff vested-portion engine (byte-faithful to
 * `clique_lock::calculate_claimable_amount`). Mode 0 = per-second/interval
 * step, mode 1 = UTC calendar-month step (`diffMonths`). A sanctioned
 * dual-format contract; never merged with the EVM arm.
 *
 * `solanaVestedPortion` is reached only through the `claimable.ts` facade.
 */

/** UTC calendar-month difference (floored at 0), matching on-chain `diff_months`. */
function diffMonths(from: bigint, to: bigint): bigint {
  const fromDate = new Date(Number(from) * 1000)
  const toDate = new Date(Number(to) * 1000)
  const months =
    BigInt(toDate.getUTCFullYear() - fromDate.getUTCFullYear()) * 12n +
    BigInt(toDate.getUTCMonth() - fromDate.getUTCMonth())
  return months > 0n ? months : 0n
}

/**
 * Solana post-cliff vested portion. Mode 0 = per-second/interval step, mode 1 =
 * UTC calendar-month step. Step-snap MUST precede the multiply (SCHEME-001).
 */
export function solanaVestedPortion(
  split: UnlockSplit,
  cliffTime: bigint,
  now: bigint,
  endTime: bigint,
  pieceDuration: bigint,
): bigint {
  const { vestingPool } = split
  const { mode, interval } = decodePieceDuration(pieceDuration)
  const vestingDuration = endTime - cliffTime

  if (mode === 0n) {
    const elapsed = now - cliffTime
    if (interval === 0n) {
      return (vestingPool * elapsed) / vestingDuration
    }
    const pieces = elapsed / interval
    const totalPieces = vestingDuration / interval
    return totalPieces > 0n ? (vestingPool * pieces) / totalPieces : 0n
  }

  // mode === 1n → calendar-month vesting (UTC).
  const elapsedMonths = diffMonths(cliffTime, now)
  const totalMonths = diffMonths(cliffTime, endTime)
  if (totalMonths === 0n) return 0n
  const pieces = elapsedMonths / interval
  const totalPieces = totalMonths / interval
  return totalPieces > 0n ? (vestingPool * pieces) / totalPieces : 0n
}
