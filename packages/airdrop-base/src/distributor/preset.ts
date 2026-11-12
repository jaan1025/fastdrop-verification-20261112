import { maxUint64, maxUint256 } from "viem"
import type { ChainKind } from "@repo/acs-client/model"
import { match } from "@repo/shared/utils"
import { BPS, WAD_SOL, percentFromBps, percentFromWad } from "../scale"
import { pieceDurationFromSolanaBytes } from "../stream/piece-duration"
import type { StreamTerms } from "../stream/claimable"

/**
 * Wire `startTime` for a FLEXIBLE-start (non-fixed) preset.
 *
 * `CliqueLockHook` uses the stored `startTime` field as its existence sentinel —
 * `if (_streamPreset.startTime == 0) revert StreamPresetNotFound()` — and only
 * ever reads the value when `isFixedStart == true` (otherwise the stream starts
 * at `block.timestamp`). So a flexible preset MUST be registered with a non-zero
 * `startTime` or every claim reverts as "not found", even though the value is
 * never used for the vesting math. We store the chain's max-uint as an
 * unmistakable "flexible" marker that can't collide with a real unix timestamp.
 *
 * The single home for this build-side constant — both consoles
 * (`build-preset-payload` / `build-strategy-payloads`) encode flexible starts
 * through here so the two can't drift (the drift that left every airdrop flexible
 * preset un-claimable).
 */
export function flexibleStartSentinel(chainKind: ChainKind): string {
  return match(chainKind, {
    evm: (): bigint => maxUint256,
    solana: (): bigint => maxUint64,
  }).toString()
}

/**
 * Normalizes raw EVM/Solana on-chain stream-preset wire shapes into the shared
 * `chainKind`-discriminated `NormalizedPreset`. A sanctioned both-chain file (L4
 * carve-out): the two paired arms target one normalized shape, so splitting would
 * duplicate the target rather than separate divergent bytes — never unified.
 *
 * The legacy private `percentFromBps` and `decodePieceDurationBytes` are GONE from
 * this file; they now live once in `scale.ts` and `piece-duration.ts` (H2/H3).
 */

export function normalizeEvmStreamPreset(p: EvmStreamPresetWire): NormalizedPreset {
  return {
    chainKind: "evm",
    cliffSeconds: BigInt(p.cliffDuration),
    vestingSeconds: BigInt(p.vestingDuration),
    pieceDuration: BigInt(p.pieceDuration),
    startUnlockPercent: percentFromWad(p.startUnlockPercentage, "evm"),
    cliffUnlockPercent: percentFromWad(p.cliffUnlockPercentage, "evm"),
    startTimeUnix: BigInt(p.startTime),
    isFixedStart: p.isFixedStart,
    lock: p.lock,
  }
}

export function normalizeSolanaStreamPreset(p: SolanaStreamPresetWire): NormalizedPreset {
  return {
    chainKind: "solana",
    cliffSeconds: BigInt(p.cliffDuration),
    vestingSeconds: BigInt(p.vestingDuration),
    pieceDuration: pieceDurationFromSolanaBytes(p.pieceDuration),
    startUnlockPercent: percentFromBps(p.startUnlockBps),
    cliffUnlockPercent: percentFromBps(p.cliffUnlockBps),
    startTimeUnix: BigInt(p.startTime),
    isFixedStart: p.isFixedStart,
    lock: p.lockProgram,
  }
}

type NormalizedPresetBase = {
  cliffSeconds: bigint
  vestingSeconds: bigint
  /** 256-bit value: byte 23 = mode (0=interval/1=calendar), bytes 24..31 = u64 BE. */
  pieceDuration: bigint
  startUnlockPercent: number
  cliffUnlockPercent: number
  startTimeUnix: bigint
  isFixedStart: boolean
  /** Lock contract/program address (EVM lowercase vs Solana base58). */
  lock: string
}

/**
 * Normalized representation of a deployed schedule's on-chain stream preset,
 * discriminated by `chainKind` so the address space of `lock` is recoverable
 * downstream (analysis M4).
 */
export type NormalizedPreset =
  | ({ chainKind: Extract<ChainKind, "evm"> } & NormalizedPresetBase)
  | ({ chainKind: Extract<ChainKind, "solana"> } & NormalizedPresetBase)

/** Raw on-chain shape returned by `CliqueLockHook.streamPresets(...)`. */
export type EvmStreamPresetWire = {
  cliffDuration: bigint | string
  vestingDuration: bigint | string
  pieceDuration: bigint | string
  startUnlockPercentage: bigint | string
  cliffUnlockPercentage: bigint | string
  startTime: bigint | string
  isFixedStart: boolean
  lock: string
}

/** Raw on-chain shape of a Solana `StreamPreset` PDA. */
export type SolanaStreamPresetWire = {
  cliffDuration: bigint | number
  vestingDuration: bigint | number
  /** 32-byte big-endian piece duration. */
  pieceDuration: ReadonlyArray<number> | Uint8Array
  startUnlockBps: number
  cliffUnlockBps: number
  startTime: bigint | number
  isFixedStart: boolean
  lockProgram: string
}

/**
 * Chain-free timestamp derivation shared by both preset→terms builders:
 * fixed-start anchors at the preset's own `startTime`, flexible-start at `now`;
 * cliff and end are plain duration sums either way.
 */
function resolveStreamTimestamps(
  preset: {
    startTime: bigint | string | number
    cliffDuration: bigint | string | number
    vestingDuration: bigint | string | number
    isFixedStart: boolean
  },
  now: bigint,
): { startTime: bigint; cliffTime: bigint; endTime: bigint } {
  const startTime = preset.isFixedStart ? BigInt(preset.startTime) : now
  const cliffTime = startTime + BigInt(preset.cliffDuration)
  const endTime = cliffTime + BigInt(preset.vestingDuration)
  return { startTime, cliffTime, endTime }
}

/**
 * Builds `StreamTerms` from a raw EVM stream preset wire (percentages already
 * WAD_EVM) + the off-chain allocation amount. `startTime` resolves against
 * `isFixedStart`: fixed → the preset's `startTime`; flexible → `now`. Sets
 * `chainKind: 'evm'`.
 */
export function streamTermsFromEvmPreset(
  preset: Pick<
    EvmStreamPresetWire,
    | "startTime"
    | "cliffDuration"
    | "vestingDuration"
    | "startUnlockPercentage"
    | "cliffUnlockPercentage"
    | "pieceDuration"
    | "isFixedStart"
  >,
  amount: bigint,
  now: bigint,
): StreamTerms {
  return {
    chainKind: "evm",
    ...resolveStreamTimestamps(preset, now),
    amount,
    startUnlockPercentage: BigInt(preset.startUnlockPercentage),
    cliffUnlockPercentage: BigInt(preset.cliffUnlockPercentage),
    pieceDuration: BigInt(preset.pieceDuration),
  }
}

/**
 * Builds `StreamTerms` from a raw Solana stream preset wire. Solana presets
 * store percentages in BPS — converted to WAD_SOL here per SCHEME-010
 * (`(bps × 1e9) ÷ 10_000`) — and `pieceDuration` as a 32-byte array, decoded to
 * the same 256-bit shape EVM uses. Sets `chainKind: 'solana'`.
 */
export function streamTermsFromSolanaPreset(
  preset: Pick<
    SolanaStreamPresetWire,
    | "startTime"
    | "cliffDuration"
    | "vestingDuration"
    | "startUnlockBps"
    | "cliffUnlockBps"
    | "pieceDuration"
    | "isFixedStart"
  >,
  amount: bigint,
  now: bigint,
): StreamTerms {
  return {
    chainKind: "solana",
    ...resolveStreamTimestamps(preset, now),
    amount,
    startUnlockPercentage: (BigInt(preset.startUnlockBps) * WAD_SOL) / BPS,
    cliffUnlockPercentage: (BigInt(preset.cliffUnlockBps) * WAD_SOL) / BPS,
    pieceDuration: pieceDurationFromSolanaBytes(preset.pieceDuration),
  }
}
