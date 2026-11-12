import type { Strategy } from "../generated/types/strategy"
import { concatBytes } from "@repo/chain-solana-kit/utils"
import { WAD_SOL } from "@repo/airdrop-base/scale"
import { serializeHookDataInput, serializeStrategyData } from "./hook-encoders"

/**
 * [golden-test] Build the `extra` field for a merkle-distributor claim
 * instruction. These bytes MUST be byte-identical to what the ACS relay signs
 * and what the on-chain `claim` instruction verifies (`prepare-claim-extra.ts`).
 *
 * Layout: `[configuratorIndex, ...borsh(HookDataInput)]`
 *
 * For every strategy in the batch config, the hook-specific data is serialised
 * with `hookAmount = claimable * strategy.proportion / WAD_SOL`. The fallback hook
 * receives `claimable − Σ(non-fallback CONSUMED)` instead.
 *
 * Most hooks consume their full proportional share, but a Penalty hook consumes
 * only the forfeited slice (`penalty.rs` returns `consumed: penalty_amount` <
 * share) — the caller predicts that via the base `solanaPenaltyAmount` mirror
 * and passes it as `consumed` so the fallback is sized by REAL on-chain
 * consumption. Counting
 * the full share there would under-size the fallback transfer → on-chain
 * `ConsumedAmountMismatch (6012)`. The strategy still ENCODES its full
 * `hookAmount` (penalty.rs requires `hook_data.amount == share`). Mirrors the EVM
 * arm (`buildEvmClaimExtra` + `resolveHookConsumed`).
 *
 * `claimAt` (the Penalty payload's on-chain ±60s timestamp) is injected so the
 * byte serializer stays pure; it defaults to the current unix second when the
 * caller does not pass one (`prepareSolanaClaimExtra` is the orchestration edge).
 */
export const buildClaimExtra = (params: {
  configuratorIndex: number
  strategies: ReadonlyArray<
    Strategy & {
      /**
       * The amount this strategy ACTUALLY consumes on-chain, when it differs
       * from its proportional share (a Penalty hook consumes only
       * `getPenalty(share)`). Omit for hooks that consume their full share
       * (transfer/lock); defaults to the share, keeping non-penalty paths +
       * golden vectors unchanged.
       */
      consumed?: bigint
    }
  >
  fallbackHook: number
  claimable: bigint
  /** Penalty `claim_at` (unix seconds). Defaults to the current second. */
  claimAt?: bigint
}): Uint8Array => {
  const { configuratorIndex, strategies, fallbackHook, claimable } = params
  const claimAt = params.claimAt ?? BigInt(Math.floor(Date.now() / 1000))

  const items: Uint8Array[] = []
  let totalConsumed = 0n

  // First pass — non-fallback strategies
  for (let i = 0; i < strategies.length; i++) {
    if (i === fallbackHook) {
      items.push(new Uint8Array(0)) // placeholder, filled below
      continue
    }

    const { hookType, proportion, consumed } = strategies[i]!
    const hookAmount = (claimable * proportion) / WAD_SOL
    // Size the fallback by REAL consumption — a Penalty hook consumes less than
    // its share. Still ENCODE the full `hookAmount` below (the hook checks it).
    totalConsumed += consumed ?? hookAmount
    items.push(serializeStrategyData(hookType, hookAmount, claimAt))
  }

  // Second pass — fallback gets the remainder
  if (fallbackHook < strategies.length) {
    const fallbackAmount = claimable - totalConsumed
    const { hookType } = strategies[fallbackHook]!
    items[fallbackHook] = serializeStrategyData(hookType, fallbackAmount, claimAt)
  }

  // Assemble: [configIdx, ...borsh(HookDataInput)]
  const hookDataBytes = serializeHookDataInput(items)
  return concatBytes(new Uint8Array([configuratorIndex]), hookDataBytes)
}
