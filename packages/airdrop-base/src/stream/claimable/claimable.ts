import { match } from "@repo/shared/utils"
import { deriveUnlockSplit, resolvePhase } from "./phases"
import { evmVestedPortion } from "./claimable-evm"
import { solanaVestedPortion } from "./claimable-solana"
import type { ClaimableResult, StreamTerms } from "./terms"

/**
 * Facade for the off-chain pre-claim claimable twin (SCHEME-001 + SCHEME-010): runs
 * the shared phase branch, then dispatches the post-cliff vested portion to the
 * EVM or Solana leaf via exhaustive `match(chainKind)`. Thin facade only — it owns
 * the dispatch + the shared phase glue; the chain-specific vested-portion math
 * lives in the leaves, the chain-free phase math in `phases.ts`.
 *
 * Mirrors the on-chain routine bit-for-bit; the two leaf engines are a deliberate
 * dual-format contract — never unified.
 */
export function calculateClaimableAmount(
  stream: StreamTerms,
  now: bigint,
  claimedAmount: bigint = 0n,
): ClaimableResult {
  const net = (totalUnlocked: bigint): bigint => {
    const c = totalUnlocked - claimedAmount
    return c > 0n ? c : 0n
  }

  const phase = resolvePhase(stream, now)

  switch (phase) {
    case "before_start":
      return { totalUnlocked: 0n, claimable: net(0n), phase }
    case "complete":
      return {
        totalUnlocked: stream.amount,
        claimable: net(stream.amount),
        phase,
      }
    case "cliff": {
      const { startUnlockAmount } = deriveUnlockSplit(stream)
      return {
        totalUnlocked: startUnlockAmount,
        claimable: net(startUnlockAmount),
        phase,
      }
    }
    case "vesting": {
      const split = deriveUnlockSplit(stream)
      const vestedPortion = match(stream.chainKind, {
        evm: () =>
          evmVestedPortion(
            split,
            now - stream.cliffTime,
            stream.endTime - stream.cliffTime,
            stream.pieceDuration,
          ),
        solana: () =>
          solanaVestedPortion(split, stream.cliffTime, now, stream.endTime, stream.pieceDuration),
      })
      const totalUnlocked = split.startUnlockAmount + split.cliffUnlockAmount + vestedPortion
      return { totalUnlocked, claimable: net(totalUnlocked), phase }
    }
  }
}
