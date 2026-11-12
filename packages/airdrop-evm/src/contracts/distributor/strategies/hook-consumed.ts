import { type PublicClient, type Hash } from "viem"
import { evmPenaltyAmount } from "@repo/airdrop-base/distributor"
import { getPenaltyConfig } from "./linear-penalty-hook/functions"
import { type HookContracts } from "./claim-extra"
import { type HookType } from "./hook-encoders"

/**
 * What a hook needs to PREDICT the `_consumed` its on-chain `execute` will
 * return, so `buildEvmClaimExtra` can size the fallback by REAL consumption
 * (the fallback absorbs `claimable - Σ consumed`).
 */
export interface HookConsumedContext {
  /**
   * The proportional share the distributor hands this hook —
   * `_amount.mulWad(proportion)` on-chain, i.e. `claimable * proportion / WAD`.
   */
  share: bigint
  /** `claimAt` stamped into the claim (the penalty curve's time input). */
  claimAt: bigint
  /** The claim's `configurationId` (the penalty-config key). */
  configurationId: Hash
  /** Resolved hook addresses, for hooks that read chain state. */
  hookContracts: HookContracts
  /** For hooks whose consumption depends on chain state. */
  publicClient: PublicClient
}

export type HookConsumedResolver = (ctx: HookConsumedContext) => Promise<bigint>

/**
 * Per-hook prediction of `IHook.execute`'s `_consumed` return — each hook owns
 * its own rule, mirroring its on-chain `execute`. Parallel to
 * `HOOK_STRATEGY_ENCODERS` (which owns the per-hook `extra` ENCODING). Most hooks
 * consume the full share they're handed; only `linear-penalty` consumes less (it
 * forfeits `getPenalty(share)` and delivers nothing), so a wrong prediction
 * under-sizes the fallback transfer → on-chain `ConsumedAmountMismatch`. The
 * FALLBACK strategy never routes through here — it absorbs the remainder.
 */
export const HOOK_CONSUMED_RESOLVERS: Record<HookType, HookConsumedResolver> = {
  // `TransferHook.execute` returns its encoded `_amount` (== the share for a
  // non-fallback strategy).
  transfer: ({ share }) => Promise.resolve(share),
  // `transfer-with-cap` is an address alias of `transfer` — identical consumption.
  "transfer-with-cap": ({ share }) => Promise.resolve(share),
  // `CliqueLockHook` locks the whole share it is handed.
  lock: ({ share }) => Promise.resolve(share),
  // `TransferOrCoinFlip` consumes the share OR 0 by an on-chain flip —
  // non-deterministic, can't be predicted; assume the full share.
  "transfer-or-coin-flip": ({ share }) => Promise.resolve(share),
  // `LinearPenaltyHook.execute` returns `getPenalty(share)` (< share) and
  // delivers nothing — read the hook's penalty WINDOW from chain, then compute
  // the forfeited slice locally via the base contract-mirror
  // (`evmPenaltyAmount`, same SINGLE-floor formula as `getPenalty`), using the
  // SAME `configurationId` + `claimAt` the claim signs/uses so it is
  // bit-identical to the contract.
  "linear-penalty": async ({ share, claimAt, configurationId, hookContracts, publicClient }) => {
    if (!hookContracts.linearPenalty) {
      // Unreachable via `resolveHookType` — the 'linear-penalty' kind is itself
      // resolved by matching this very address. A direct caller passing an
      // inconsistent context must fail loudly rather than mispredict
      // consumption (a wrong prediction reverts on-chain as
      // ConsumedAmountMismatch anyway). Mirrors the Solana arm's
      // missing-config throw.
      throw new Error("linear-penalty hook address missing from hookContracts")
    }
    const config = await getPenaltyConfig(publicClient, {
      linearPenaltyHook: hookContracts.linearPenalty,
      configurationId,
    })
    return evmPenaltyAmount(share, config, claimAt)
  },
}

/** Dispatch a hook's `_consumed` prediction through {@link HOOK_CONSUMED_RESOLVERS}. */
export const resolveHookConsumed = (
  hookType: HookType,
  ctx: HookConsumedContext,
): Promise<bigint> => HOOK_CONSUMED_RESOLVERS[hookType](ctx)
