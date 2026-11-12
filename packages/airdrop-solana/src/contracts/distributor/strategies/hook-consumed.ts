import type { Address, Rpc, SolanaRpcApi } from "@solana/kit"
import { solanaPenaltyAmount } from "@repo/airdrop-base/distributor"
import { HookType } from "../generated/types/hookType"
import { getPenaltyConfigPDA } from "../functions/pda"
import { fetchPenaltyConfig } from "../functions/fetch"
import { solanaPenaltyTerms } from "./penalty/terms"

/**
 * What a hook needs to PREDICT the `consumed` its on-chain `execute` returns, so
 * `buildClaimExtra` can size the fallback by REAL consumption (the fallback
 * absorbs `claimable - Σ consumed`). Parallel to the EVM arm's
 * `HookConsumedContext`; the penalty resolver reads its config from chain, so the
 * `rpc` + PDA-seed inputs (`distributorPda`, `configurator`) ride along.
 */
export interface HookConsumedContext {
  rpc: Rpc<SolanaRpcApi>
  /** The proportional share the distributor hands this hook — `claimable * proportion / WAD_SOL`. */
  share: bigint
  /** `claimAt` stamped into the claim (the penalty curve's time input). */
  claimAt: bigint
  /** Distributor PDA — half of the penalty-config PDA seed. */
  distributorPda: Address
  /** Configurator bytes — the other half of the penalty-config PDA seed. */
  configurator: Uint8Array
}

export type HookConsumedResolver = (ctx: HookConsumedContext) => Promise<bigint>

/**
 * Per-hook prediction of the on-chain `HookResult.consumed` — each hook owns its
 * own rule, mirroring its `execute` in the merkle-distributor program. Parallel
 * to the EVM arm's `HOOK_CONSUMED_RESOLVERS` (which owns the same prediction over
 * there). Most hooks consume the full share they're handed; only `Penalty`
 * consumes less (the forfeited slice `penalty.rs` returns as `consumed`), so a
 * wrong prediction under-sizes the fallback transfer → on-chain
 * `ConsumedAmountMismatch (6012)`. The FALLBACK strategy never routes through
 * here — it absorbs the remainder.
 */
export const HOOK_CONSUMED_RESOLVERS: Record<HookType, HookConsumedResolver> = {
  // `TransferHook.execute` returns its encoded `amount` (== the share for a
  // non-fallback strategy).
  [HookType.Transfer]: ({ share }) => Promise.resolve(share),
  // `LockHook` locks the whole share it is handed.
  [HookType.Lock]: ({ share }) => Promise.resolve(share),
  // `PenaltyHook.execute` returns `consumed: penalty_amount` (< share) and the
  // fallback delivers the rest — read the penalty config and predict the exact
  // forfeited amount with the SAME `claimAt` the claim signs/encodes, so it is
  // bit-identical to the contract. Mirrors the EVM arm's `getPenalty(share)`.
  [HookType.Penalty]: async ({ rpc, share, claimAt, distributorPda, configurator }) => {
    const [penaltyConfigPda] = await getPenaltyConfigPDA({
      distributor: distributorPda,
      configurator,
    })
    const penaltyConfig = await fetchPenaltyConfig(rpc, penaltyConfigPda)
    if (!penaltyConfig) {
      throw new Error("Penalty config not found on-chain")
    }
    return solanaPenaltyAmount(share, solanaPenaltyTerms(penaltyConfig), claimAt)
  },
}

/** Dispatch a hook's `consumed` prediction through {@link HOOK_CONSUMED_RESOLVERS}. */
export const resolveHookConsumed = (
  hookType: HookType,
  ctx: HookConsumedContext,
): Promise<bigint> => HOOK_CONSUMED_RESOLVERS[hookType](ctx)
