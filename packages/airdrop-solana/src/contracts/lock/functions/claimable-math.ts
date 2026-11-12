import type { Stream } from "./fetch"
import { WAD_SOL } from "@repo/airdrop-base/scale"

/**
 * [golden-test] The on-chain Solana claimable twin — ported from
 * `clique-lock-svm/.../utils.rs::calculate_claimable_amount`. This is the
 * ON-CHAIN account path (reads a live `Stream`), the paired arm of the kernel's
 * pre-claim math (`@repo/airdrop-base/stream`). Deliberately NOT unified with
 * EVM (EVM has no calendar logic) and NOT unified with the kernel pre-claim twin
 * (different input: a live stream account vs an allocation schedule). A
 * single-chain byte contract that ships whole (L4 carve-out).
 *
 * `pieceDuration` is a 32-byte field: byte[23] = mode, bytes[24..32] = interval
 * (u64 big-endian). Mode 0 = per-second/per-block vesting; mode 1 = fixed
 * monthly vesting (calendar `diffMonths`).
 */
export const calculateClaimableAmount = (stream: Stream, now: bigint): bigint => {
  const {
    startTime,
    cliffTime,
    endTime,
    amount,
    startUnlockPercentage,
    cliffUnlockPercentage,
    pieceDuration,
  } = stream

  // t ∈ [0, startTime): nothing unlocked yet
  if (now < startTime) {
    return 0n
  }

  // t ∈ [endTime, ∞): everything unlocked
  if (now >= endTime) {
    return amount
  }

  const startUnlockAmount = (amount * startUnlockPercentage) / WAD_SOL
  const cliffUnlockAmount = (amount * cliffUnlockPercentage) / WAD_SOL
  const vestedAmount = amount - startUnlockAmount - cliffUnlockAmount

  // t ∈ [startTime, cliffTime): only start unlock amount
  if (now < cliffTime) {
    return startUnlockAmount
  }

  // t ∈ [cliffTime, endTime): start + cliff + vested portion
  const mode = pieceDuration[23]
  const intervalBytes = new Uint8Array(pieceDuration.slice(24, 32))
  const interval = new DataView(intervalBytes.buffer).getBigUint64(0, false) // big-endian

  const vestingDuration = endTime - cliffTime

  // Mode 0: per-second/per-block vesting
  if (mode === 0) {
    const elapsedTime = now - cliffTime

    if (interval === 0n) {
      // Pure linear vesting
      return startUnlockAmount + cliffUnlockAmount + (vestedAmount * elapsedTime) / vestingDuration
    }
    // Piece-based vesting
    const pieces = elapsedTime / interval
    const totalPieces = vestingDuration / interval
    return startUnlockAmount + cliffUnlockAmount + (vestedAmount * pieces) / totalPieces
  }

  // Mode 1: fixed-monthly vesting
  if (mode === 1) {
    const elapsedMonths = diffMonths(cliffTime, now)
    const pieces = elapsedMonths / interval
    const totalPieces = diffMonths(cliffTime, endTime) / interval
    return startUnlockAmount + cliffUnlockAmount + (vestedAmount * pieces) / totalPieces
  }

  return 0n
}

/** Calendar month difference between two unix timestamps (UTC), floored at 0. */
const diffMonths = (from: bigint, to: bigint): bigint => {
  const fromDate = new Date(Number(from) * 1000)
  const toDate = new Date(Number(to) * 1000)
  const months =
    BigInt(toDate.getUTCFullYear() - fromDate.getUTCFullYear()) * 12n +
    BigInt(toDate.getUTCMonth() - fromDate.getUTCMonth())
  return months > 0n ? months : 0n
}

/** Currently claimable = total unlocked − already claimed (floored at 0). */
export const getClaimableAmount = (stream: Stream, now: bigint): bigint => {
  const totalUnlocked = calculateClaimableAmount(stream, now)
  const claimable = totalUnlocked - stream.claimedAmount
  return claimable > 0n ? claimable : 0n
}

/** The four claimable quantities of a live Stream at wall-clock `now`. */
export interface ClaimableMetrics {
  /** Claimable right now = unlocked − already claimed (floored at 0). */
  claimable: bigint
  /** Total unlocked so far = claimable + already claimed. */
  totalUnlocked: bigint
  /** Already claimed (`stream.claimedAmount`). */
  claimed: bigint
  /** Full allocation (`stream.amount`). */
  total: bigint
}

/**
 * Shape the four claimable quantities from a live Stream at `now` (a bigint param
 * — wall-clock `Date.now()` stays at the query edge). Deliberately NOT unified
 * with `@repo/airdrop-base` StreamMetrics: that twin shapes the pre-claim
 * allocation-schedule path, this one shapes a live on-chain Stream account.
 */
export const assembleClaimableMetrics = (stream: Stream, now: bigint): ClaimableMetrics => {
  const claimable = getClaimableAmount(stream, now)
  return {
    claimable,
    totalUnlocked: claimable + stream.claimedAmount,
    claimed: stream.claimedAmount,
    total: stream.amount,
  }
}
