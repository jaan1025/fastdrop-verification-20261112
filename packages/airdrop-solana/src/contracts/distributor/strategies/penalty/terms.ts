import type { PenaltyTerms } from "@repo/airdrop-base/distributor"
import type { PenaltyConfig } from "../../functions/fetch"

/**
 * Wire → model: lift an on-chain `PenaltyConfig` account into the base
 * `PenaltyTerms` (Solana arm). The curve math itself lives in
 * `@repo/airdrop-base/distributor` (`solanaPenaltyAmount`).
 */
export function solanaPenaltyTerms(
  config: Pick<PenaltyConfig, "beginTime" | "endTime" | "startPenalty" | "endPenalty">,
): Extract<PenaltyTerms, { chainKind: "solana" }> {
  return {
    chainKind: "solana",
    beginTime: config.beginTime,
    endTime: config.endTime,
    startPenalty: config.startPenalty,
    endPenalty: config.endPenalty,
  }
}
