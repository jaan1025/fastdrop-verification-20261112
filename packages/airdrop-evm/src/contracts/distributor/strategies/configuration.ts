import { type Address, type Hash, type PublicClient } from "viem"
import type { Configuration, StrategyKind } from "@repo/airdrop-base/distributor"
import { getStrategies } from "../functions/reads"
import { resolveHookType, type HookContracts, type HookType } from "./claim-extra"
import { getPenaltyConfig } from "./linear-penalty-hook/functions"
import { evmPenaltyTerms } from "./linear-penalty-hook/terms"

/**
 * Resolved hook type → the base strategy vocabulary. `transfer-with-cap` is an
 * address alias of plain transfer (same on-chain semantics — F6), so it maps to
 * `transferHook`; the coin-flip hook's outcome is not predictable, so it rides
 * the `customHook` full-delivery assumption.
 */
export const STRATEGY_KIND_BY_HOOK_TYPE: Record<HookType, StrategyKind> = {
  transfer: "transferHook",
  "transfer-with-cap": "transferHook",
  lock: "lockHook",
  "transfer-or-coin-flip": "customHook",
  "linear-penalty": "linearPenaltyHook",
}

/**
 * Lift the on-chain batch configuration at `configurationIndex` (claim paths
 * hardcode 0) into the base `Configuration`, ready for
 * `configurationClaimable` / `configurationClaimed`. Hook ADDRESSES resolve to
 * kinds via the deployment's known hook contracts; the penalty window is read
 * from the linear-penalty hook iff one is configured. A missing/unknown penalty
 * hook address leaves `penalty` undefined — base treats that as an unset config
 * (zero penalty).
 */
export const resolveConfiguration = async (
  publicClient: PublicClient,
  params: {
    distributor: Address
    root: Hash
    hookContracts: HookContracts
    configurationIndex?: number
  },
): Promise<Configuration> => {
  const { distributor, root, hookContracts, configurationIndex = 0 } = params

  const { strategies, fallbackHook, configurationId } = await getStrategies(publicClient, {
    distributor,
    root,
    configurationIndex,
  })

  const kinds = strategies.map(
    (s) => STRATEGY_KIND_BY_HOOK_TYPE[resolveHookType(s.hook, hookContracts)],
  )

  const penalty =
    kinds.includes("linearPenaltyHook") && hookContracts.linearPenalty
      ? evmPenaltyTerms(
          await getPenaltyConfig(publicClient, {
            linearPenaltyHook: hookContracts.linearPenalty,
            configurationId,
          }),
        )
      : undefined

  return {
    chainKind: "evm",
    fallbackIndex: Number(fallbackHook),
    strategies: strategies.map((s, i) => ({
      kind: kinds[i]!,
      proportion: s.proportion,
      ...(kinds[i] === "linearPenaltyHook" && penalty ? { penalty } : {}),
    })),
  }
}
