import type { PenaltyTerms } from "@repo/airdrop-base/distributor"

/**
 * Wire → model: lift a `penaltyConfigs(configurationId)` read into the base
 * `PenaltyTerms` (EVM arm — the contract hardcodes the 100%→0 curve, so the
 * terms are just the window). The curve math lives in
 * `@repo/airdrop-base/distributor` (`evmPenaltyAmount`).
 */
export function evmPenaltyTerms(config: {
  beginTime: bigint
  endTime: bigint
}): Extract<PenaltyTerms, { chainKind: "evm" }> {
  return {
    chainKind: "evm",
    beginTime: config.beginTime,
    endTime: config.endTime,
  }
}
