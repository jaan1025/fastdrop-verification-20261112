import type { Address, Rpc, SolanaRpcApi } from "@solana/kit"
import type { Configuration, StrategyKind } from "@repo/airdrop-base/distributor"
import { HookType } from "../generated/types/hookType"
import type { Strategy } from "../generated/types/strategy"
import { getPenaltyConfigPDA } from "../functions/pda"
import { fetchPenaltyConfig } from "../functions/fetch"
import { solanaPenaltyTerms } from "./penalty/terms"

/** On-chain `HookType` enum → the base strategy vocabulary. */
export const STRATEGY_KIND_BY_HOOK_TYPE: Record<HookType, StrategyKind> = {
  [HookType.Transfer]: "transferHook",
  [HookType.Lock]: "lockHook",
  [HookType.Penalty]: "linearPenaltyHook",
}

/**
 * Lift one on-chain batch configuration into the base `Configuration`
 * so `configurationClaimable` / `configurationClaimed` can run on it. Fetches
 * the configurator's `PenaltyConfig` PDA iff a penalty strategy is present
 * (the PDA is per-configurator, shared by every penalty strategy in it). A
 * missing penalty account leaves `penalty` undefined — base treats that as an
 * unset config (zero penalty), matching the display-lenient convention.
 */
export const resolveConfiguration = async (
  rpc: Rpc<SolanaRpcApi>,
  params: {
    distributorPda: Address
    configurator: Uint8Array
    strategies: readonly Strategy[]
    fallbackHook: number
  },
): Promise<Configuration> => {
  const { distributorPda, configurator, strategies, fallbackHook } = params

  const hasPenalty = strategies.some((s) => s.hookType === HookType.Penalty)
  const penalty = hasPenalty
    ? await (async () => {
        const [penaltyConfigPda] = await getPenaltyConfigPDA({
          distributor: distributorPda,
          configurator,
        })
        const config = await fetchPenaltyConfig(rpc, penaltyConfigPda)
        return config ? solanaPenaltyTerms(config) : undefined
      })()
    : undefined

  return {
    chainKind: "solana",
    fallbackIndex: fallbackHook,
    strategies: strategies.map((s) => ({
      kind: STRATEGY_KIND_BY_HOOK_TYPE[s.hookType],
      proportion: s.proportion,
      ...(s.hookType === HookType.Penalty && penalty ? { penalty } : {}),
    })),
  }
}
