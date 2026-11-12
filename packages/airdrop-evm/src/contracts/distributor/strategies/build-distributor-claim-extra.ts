import { type PublicClient, type Address, type Hash } from "viem"
import { WAD_EVM } from "@repo/airdrop-base/scale"
import { getStrategies } from "../functions/reads"
import { resolveHookType, buildEvmClaimExtra } from "./claim-extra"
import { resolveHookConsumed } from "./hook-consumed"
import { type HookContracts } from "./claim-extra"

/**
 * [golden-test] Assembles the EVM distributor claim `_extra` bytes end-to-end:
 * reads the on-chain strategy set for the root, stamps `claimAt` from the latest
 * block, predicts each strategy's real on-chain `_consumed`, then encodes via the
 * FROZEN `buildEvmClaimExtra`. The self-sign (portal) and admin-relay claim leaves
 * both call this; the emitted bytes are what ACS co-signs, so they must be
 * byte-identical to the on-chain-verified `_extra` or the claim's co-signature
 * fails. Pinned by golden vectors.
 *
 * Returns only the assembled `extra` — `claimAt`/`strategies`/`configurationId`
 * are internal to the assembly and never escape to the caller.
 */
export const buildEvmDistributorClaimExtra = async (
  publicClient: PublicClient,
  params: {
    distributor: Address
    root: Hash
    /** The claimable amount split across strategies (== released for initial claims). */
    claimable: bigint
    hookContracts: HookContracts
    /** Which configuration to read + encode; both stay coupled to this index. */
    configurationIndex?: number
  },
): Promise<Hash> => {
  const { distributor, root, claimable, hookContracts, configurationIndex = 0 } = params

  const { strategies, fallbackHook, configurationId } = await getStrategies(publicClient, {
    distributor,
    root,
    configurationIndex,
  })
  // Stamp `claimAt` from the latest on-chain block, NOT the wall clock: the
  // pre-send `simulateContract` runs against that block, so a wall-clock `now`
  // (ahead of it) makes LinearPenaltyHook revert `InvalidTimestamp` at
  // simulation. See `buildEvmClaimExtra`.
  const { timestamp: claimAt } = await publicClient.getBlock()

  // Predict each strategy's on-chain `_consumed` so the fallback is sized by
  // REAL consumption — a linear-penalty hook consumes only `getPenalty(share)`,
  // so counting its full share would under-size the fallback transfer →
  // ConsumedAmountMismatch. Per-hook rule lives in `resolveHookConsumed`.
  const resolvedStrategies = await Promise.all(
    strategies.map(async ({ proportion, hook }) => {
      const hookType = resolveHookType(hook, hookContracts)
      const consumed = await resolveHookConsumed(hookType, {
        share: (claimable * proportion) / WAD_EVM,
        claimAt,
        configurationId,
        hookContracts,
        publicClient,
      })
      return { proportion, hookType, consumed }
    }),
  )
  return buildEvmClaimExtra({
    configurationIndex,
    strategies: resolvedStrategies,
    fallbackHook: Number(fallbackHook),
    claimable,
    claimAt,
  })
}
