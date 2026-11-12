import type { ChainKind } from "@repo/acs-client/model"
import { wadFor } from "../../scale"

/**
 * The slice of a claim a non-fallback strategy is handed — the exact integer
 * mirror of the distributor's split: EVM `_amount.mulWad(proportion)`
 * (Distributor.sol), Solana `calculate_hook_amount` (claim.rs). Multiply before
 * a single floored division by the chain's WAD.
 */
export function strategyShare(amount: bigint, proportion: bigint, chainKind: ChainKind): bigint {
  return (amount * proportion) / wadFor(chainKind)
}
