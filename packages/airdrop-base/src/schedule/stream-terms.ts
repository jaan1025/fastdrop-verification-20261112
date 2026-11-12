import type { ChainKind } from "@repo/acs-client/model"
import { match } from "@repo/shared/utils"
import { BPS, WAD_SOL, toWadPercent } from "../scale"
import type { StreamTerms } from "../stream/claimable"

/**
 * Off-chain `Schedule` → `StreamTerms`: simulates the stream a first claim
 * WOULD create, so `calculateClaimableAmount` (the on-chain twin) can quote
 * pre-claim unlock progress without an on-chain preset read.
 *
 * - Fixed start anchors at the schedule's own start; FLEXIBLE start anchors at
 *   `now` — a claim right now would create the stream now, so the TGE portion
 *   reads as unlocked immediately (on EVM the create even auto-claims it).
 * - Percent scaling round-trips the deploy path exactly: the same
 *   `toWadPercent` the preset payload builder writes, then Solana's bps →
 *   WAD_SOL lift (mirroring `streamTermsFromSolanaPreset`), so the simulated
 *   terms match what the deployed preset would produce.
 */
export function streamTermsFromSchedule(
  schedule: {
    cliffSeconds: bigint
    vestingSeconds: bigint
    /** Form percent, 0–100. */
    startUnlockPercent: number
    cliffUnlockPercent: number
    isFixedStart: boolean
    startTimeUnix: bigint | null
    /** 256-bit encoded interval — canonical layout in `./piece-duration.ts`
     * (mode flag + u64 interval; passed through untouched). */
    pieceDuration: bigint
  },
  params: { amount: bigint; chainKind: ChainKind; now: bigint },
): StreamTerms {
  const { amount, chainKind, now } = params
  const startTime =
    schedule.isFixedStart && schedule.startTimeUnix != null ? schedule.startTimeUnix : now
  const cliffTime = startTime + schedule.cliffSeconds
  return {
    chainKind,
    startTime,
    cliffTime,
    endTime: cliffTime + schedule.vestingSeconds,
    amount,
    startUnlockPercentage: percentToTermsWad(schedule.startUnlockPercent, chainKind),
    cliffUnlockPercentage: percentToTermsWad(schedule.cliffUnlockPercent, chainKind),
    pieceDuration: schedule.pieceDuration,
  }
}

function percentToTermsWad(percent: number, chainKind: ChainKind): bigint {
  const wire = BigInt(toWadPercent(percent, chainKind))
  return match(chainKind, {
    evm: () => wire,
    solana: () => (wire * WAD_SOL) / BPS,
  })
}
