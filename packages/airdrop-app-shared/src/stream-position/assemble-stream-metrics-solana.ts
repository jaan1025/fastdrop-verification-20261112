import { bigIntToDisplayNumber } from "@repo/shared/utils"
import type { StreamLifecycle } from "./lifecycle"
import { calculateClaimableAmount } from "@repo/airdrop-base/stream"
import { streamTermsFromSolanaPreset } from "@repo/airdrop-base/distributor"
import type { StreamMetrics, StreamRevocationInfo } from "./types"

/** The on-chain Solana stream record the leaf reads. */
export interface SolanaStreamRecord {
  amount: bigint
  claimedAmount: bigint
  startTime: bigint | number
  cliffTime: bigint | number
  endTime: bigint | number
}

/** The rich claimable result object the Solana lock returns (WAD 1e9). */
export interface SolanaClaimableResult {
  totalUnlocked: bigint
  claimable: bigint
}

/** Raw Solana stream preset wire shape (from `useStreamPreset`). */
export interface SolanaPresetWire {
  startTime: bigint | number
  cliffDuration: bigint | number
  vestingDuration: bigint | number
  startUnlockBps: number
  cliffUnlockBps: number
  pieceDuration: ReadonlyArray<number> | Uint8Array
  isFixedStart: boolean
}

export interface AssembleStreamMetricsSolanaInput {
  /** The on-chain stream record, or undefined when there's no live stream. */
  stream: SolanaStreamRecord | undefined
  /** The rich claimable result object; present once the on-chain read resolves. */
  claimable: SolanaClaimableResult | undefined
  /** Raw stream preset (drives the pre-claim estimate); undefined while loading. */
  preset: SolanaPresetWire | undefined
  /** Raw off-chain allocation (smallest unit). */
  allocationAmount: bigint | undefined
  /** Token decimals — metrics stay undefined until it resolves. */
  decimals: number | undefined
  /** Resolved lifecycle phase. */
  lifecycle: StreamLifecycle
  /** Per-stream revocation truth recovered from tx history; undefined = unknown. */
  revocation?: StreamRevocationInfo
  /** Any sub-query in flight. */
  isLoading: boolean
}

/**
 * PURE Solana stream-metrics assembler: turns the raw Solana sub-query results +
 * the preset estimate into the chain-free `StreamMetrics` display object. No
 * React, no hooks. WAD 1e9 / Solana-calendar vesting semantics. Sets
 * `streamRevoked = true` for the terminal-claimed branch — on Solana the lock
 * `close`s the stream ONLY on revoke (a full claim leaves it open), so "no
 * stream + a prior claim" is a revoke-after-partial-claim.
 */
export function assembleStreamMetricsSolana(
  input: AssembleStreamMetricsSolanaInput,
): StreamMetrics {
  const {
    stream,
    claimable,
    preset,
    allocationAmount,
    decimals,
    lifecycle,
    revocation,
    isLoading,
  } = input

  if (decimals === undefined) {
    return { hasOnChainStream: lifecycle === "live", isLoading }
  }

  const allocated =
    allocationAmount !== undefined ? bigIntToDisplayNumber(allocationAmount, decimals) : undefined

  switch (lifecycle) {
    // No stream account + a prior on-chain claim = the stream was revoked (a
    // full claim leaves the Solana stream open). The recipient kept only what
    // they had claimed — report the RECOVERED total (tx-history), never the
    // full allocation; undefined = history unavailable → display as unknown.
    case "terminal-claimed": {
      const claimed =
        revocation?.claimedAmount !== undefined
          ? bigIntToDisplayNumber(revocation.claimedAmount, decimals)
          : undefined
      return {
        hasOnChainStream: false,
        amount: allocated,
        claimed,
        vested: claimed,
        claimable: 0,
        streamRevoked: true,
        isLoading,
      }
    }

    // Batch revoked before any claim: the allocation was clawed back, nothing
    // ever vested or was received. Definite zeros (the schedule code is gone, so
    // there's no preset to estimate from — see `terminal-revoked` in the
    // lifecycle resolver). Allocated stays the historical amount.
    case "terminal-revoked":
      return {
        hasOnChainStream: false,
        amount: allocated,
        claimed: 0,
        vested: 0,
        claimable: 0,
        streamRevoked: true,
        isLoading,
      }

    case "pre-claim": {
      const nowSec = BigInt(Math.floor(Date.now() / 1000))
      const preClaim =
        preset && allocationAmount !== undefined
          ? calculateClaimableAmount(
              streamTermsFromSolanaPreset(preset, allocationAmount, nowSec),
              nowSec,
              0n,
            )
          : undefined
      return {
        hasOnChainStream: false,
        amount: allocated,
        claimed: allocationAmount !== undefined ? 0 : undefined,
        vested: preClaim ? bigIntToDisplayNumber(preClaim.totalUnlocked, decimals) : undefined,
        claimable: preClaim ? bigIntToDisplayNumber(preClaim.claimable, decimals) : undefined,
        isLoading,
      }
    }

    case "live": {
      if (!stream) return { hasOnChainStream: true, isLoading }
      return {
        hasOnChainStream: true,
        amount: bigIntToDisplayNumber(stream.amount, decimals),
        claimed: bigIntToDisplayNumber(stream.claimedAmount, decimals),
        // Object-truthiness on purpose — `claimable` is the rich result object
        // (always present once the query resolves), NOT a bigint. Do NOT "align"
        // this to EVM's `!== undefined` form (there `claimable`/`vestedToDate`
        // is a raw bigint and `0n` is falsy under `?`). Keep the two shapes
        // deliberately different.
        vested: claimable ? bigIntToDisplayNumber(claimable.totalUnlocked, decimals) : undefined,
        claimable: claimable ? bigIntToDisplayNumber(claimable.claimable, decimals) : undefined,
        streamStartTime: Number(stream.startTime),
        streamCliffTime: Number(stream.cliffTime),
        streamEndTime: Number(stream.endTime),
        isLoading,
      }
    }
  }
}
