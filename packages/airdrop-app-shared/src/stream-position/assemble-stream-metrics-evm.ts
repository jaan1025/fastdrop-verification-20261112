import { bigIntToDisplayNumber } from "@repo/shared/utils"
import type { StreamLifecycle } from "./lifecycle"
import { calculateClaimableAmount } from "@repo/airdrop-base/stream"
import { streamTermsFromEvmPreset } from "@repo/airdrop-base/distributor"
import type { StreamMetrics, StreamRevocationInfo } from "./types"

/** The on-chain EVM stream record (`CliqueLock.streams[id]`) the leaf reads. */
export interface EvmStreamRecord {
  amount: bigint
  claimedAmount: bigint
  startTime: bigint | number
  cliffTime: bigint | number
  endTime: bigint | number
}

/** Raw EVM stream preset wire shape (from `useStreamPreset`). */
export interface EvmPresetWire {
  startTime: bigint | string
  cliffDuration: bigint | string
  vestingDuration: bigint | string
  startUnlockPercentage: bigint | string
  cliffUnlockPercentage: bigint | string
  pieceDuration: bigint | string
  isFixedStart: boolean
}

export interface AssembleStreamMetricsEvmInput {
  /** The on-chain stream record, or undefined when there's no live stream. */
  stream: EvmStreamRecord | undefined
  /** Gross cumulative vested-to-date from the lock's `calculateClaimableAmount`. */
  vestedToDate: bigint | undefined
  /** Raw stream preset (drives the pre-claim estimate); undefined while loading. */
  preset: EvmPresetWire | undefined
  /** Raw off-chain allocation (smallest unit). */
  allocationAmount: bigint | undefined
  /** Token decimals — metrics stay undefined until it resolves. */
  decimals: number | undefined
  /** Resolved lifecycle phase. */
  lifecycle: StreamLifecycle
  /** Per-stream revocation truth recovered from logs; undefined = unknown. */
  revocation?: StreamRevocationInfo
  /** Any sub-query in flight. */
  isLoading: boolean
}

/**
 * PURE EVM stream-metrics assembler: turns the raw EVM sub-query results + the
 * preset estimate into the chain-free `StreamMetrics` display object. No React,
 * no hooks. EVM raw-seconds vesting semantics. `streamRevoked` is set only when
 * log recovery (`revocation`) confirms a revoke — the state read alone can't
 * distinguish a revoke from a completed claim.
 */
export function assembleStreamMetricsEvm(input: AssembleStreamMetricsEvmInput): StreamMetrics {
  const {
    stream,
    vestedToDate,
    preset,
    allocationAmount,
    decimals,
    lifecycle,
    revocation,
    isLoading,
  } = input

  // Hold everything undefined (→ skeleton) until decimals resolve; a wrong
  // default silently corrupts every amount.
  if (decimals === undefined) {
    return { hasOnChainStream: lifecycle === "live", isLoading }
  }

  const allocated =
    allocationAmount !== undefined ? bigIntToDisplayNumber(allocationAmount, decimals) : undefined

  switch (lifecycle) {
    // The stream record is gone. CliqueLock deletes it on BOTH full claim and
    // revoke; only log recovery (`revocation`) tells them apart. A revoke means
    // the recipient did NOT get the rest — report the recovered received total,
    // never the full allocation.
    case "terminal-claimed": {
      if (revocation?.revoked) {
        const claimed =
          revocation.claimedAmount !== undefined
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
      // Genuine completion (or revocation unknown): everything vested + claimed.
      return {
        hasOnChainStream: false,
        amount: allocated,
        claimed: allocated,
        vested: allocated,
        claimable: 0,
        isLoading,
      }
    }

    // Batch revoked before any claim: clawed back, nothing vested or received.
    // Definite zeros (the schedule code is gone, so there's no preset to
    // estimate from). `streamRevoked` stays unset on EVM by convention (the
    // "revoked" status comes from the batch flag via `streamViewToStatus`).
    case "terminal-revoked":
      return {
        hasOnChainStream: false,
        amount: allocated,
        claimed: 0,
        vested: 0,
        claimable: 0,
        isLoading,
      }

    // No on-chain stream yet — pre-claim vesting math off the preset + amount.
    case "pre-claim": {
      const nowSec = BigInt(Math.floor(Date.now() / 1000))
      const preClaim =
        preset && allocationAmount !== undefined
          ? calculateClaimableAmount(
              streamTermsFromEvmPreset(preset, allocationAmount, nowSec),
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

    // On-chain stream exists (post-claim / initialized).
    case "live": {
      if (!stream) return { hasOnChainStream: true, isLoading }
      return {
        hasOnChainStream: true,
        amount: bigIntToDisplayNumber(stream.amount, decimals),
        claimed: bigIntToDisplayNumber(stream.claimedAmount, decimals),
        // `vestedToDate` is a raw bigint — `0n` is falsy under `?`, so guard on
        // `!== undefined` (the deliberate divergence from the Solana assembler,
        // which guards a rich result OBJECT on truthiness).
        vested:
          vestedToDate !== undefined ? bigIntToDisplayNumber(vestedToDate, decimals) : undefined,
        claimable:
          vestedToDate !== undefined
            ? bigIntToDisplayNumber(
                vestedToDate > stream.claimedAmount ? vestedToDate - stream.claimedAmount : 0n,
                decimals,
              )
            : undefined,
        streamStartTime: Number(stream.startTime),
        streamCliffTime: Number(stream.cliffTime),
        streamEndTime: Number(stream.endTime),
        isLoading,
      }
    }
  }
}
