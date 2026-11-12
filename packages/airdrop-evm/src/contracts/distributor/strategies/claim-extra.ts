import {
  type Hash,
  type Address,
  concatHex,
  encodeAbiParameters,
  isAddress,
  isAddressEqual,
  numberToHex,
} from "viem"
import { WAD_EVM } from "@repo/airdrop-base/scale"
import { HOOK_STRATEGY_ENCODERS, type HookType } from "./hook-encoders"

export type { HookType }

/**
 * Known hook contract addresses, keyed by type. Sourced from
 * `deployment.roles: Record<string, string>` (backend-typed) and cast to
 * `Address | undefined` at the call boundary.
 */
export interface HookContracts {
  transfer?: Address
  linearPenalty?: Address
  lock?: Address
  transferOrCoinFlip?: Address
  transferWithCap?: Address
}

/**
 * Guard against malformed-but-truthy values — `isAddressEqual` invokes
 * `getAddress` internally and throws `InvalidAddressError` on a bad input, which
 * would crash a claim flow that the legacy `.toLowerCase()` form silently
 * absorbed.
 */
const matchesHook = (candidate: Address | undefined, target: Address): boolean =>
  !!candidate && isAddress(candidate) && isAddressEqual(candidate, target)

/** Matches only known deployment addresses, for callers that must reject unknown hooks. */
export const resolveKnownHookType = (
  hookAddress: Address,
  hookContracts: HookContracts,
): HookType | undefined => {
  if (matchesHook(hookContracts.linearPenalty, hookAddress)) return "linear-penalty"
  if (matchesHook(hookContracts.lock, hookAddress)) return "lock"
  if (matchesHook(hookContracts.transferOrCoinFlip, hookAddress)) return "transfer-or-coin-flip"
  // F6: per the on-chain source (clique-lock/src/hook/), there is NO separate
  // `TransferWithCapHook` contract — `'transfer-with-cap'` is an ADDRESS ALIAS of
  // plain `transfer`. The `_extra` payload encodes IDENTICALLY to `transfer`
  // (a single `uint256` amount; see HOOK_STRATEGY_ENCODERS). The distinct
  // HookType literal exists only to label the configured hook address; it is
  // NOT a separate deployed contract or encoding strategy. Literal is
  // golden-pinned in the encoders — do not rename.
  if (matchesHook(hookContracts.transferWithCap, hookAddress)) return "transfer-with-cap"
  if (matchesHook(hookContracts.transfer, hookAddress)) return "transfer"
  return undefined
}

/** Legacy encoder default; live review uses the strict resolver above. */
export const resolveHookType = (hookAddress: Address, hookContracts: HookContracts): HookType =>
  resolveKnownHookType(hookAddress, hookContracts) ?? "transfer"

/**
 * [golden-test] Encodes the `_extra` claim payload: a 1-byte config index +
 * ABI-encoded `bytes[]` of per-strategy data, splitting `claimable` by WAD-1e18
 * proportion with the remainder routed to the fallback hook. Dispatches each
 * strategy to `HOOK_STRATEGY_ENCODERS[hookType]`. The ACS-signed `extra` and the
 * on-chain-verified `extra` MUST be byte-identical or the co-signature fails.
 */
export const buildEvmClaimExtra = (params: {
  configurationIndex: number
  strategies: {
    proportion: bigint
    hookType: HookType
    /**
     * The amount this strategy ACTUALLY consumes on-chain, when it differs from
     * its proportional share. A `linear-penalty` hook consumes only
     * `getPenalty(share)` (it forfeits, delivers nothing) — the caller reads
     * that on-chain and passes it so the fallback is sized by real consumption.
     * Omit for hooks that consume their full share (transfer/lock); defaults to
     * the share, keeping non-penalty paths + golden vectors unchanged.
     */
    consumed?: bigint
  }[]
  fallbackHook: number
  claimable: bigint
  coinFlipChoice?: bigint
  /**
   * Penalty-strategy validity stamp — `LinearPenaltyHook` checks
   * `block.timestamp ∈ [claimAt, claimAt+60]`. Callers SHOULD pass the latest
   * on-chain block timestamp, NOT the wall clock: the pre-send
   * `simulateContract` (eth_call) executes against the latest MINED block, whose
   * timestamp lags wall-clock `now` by ~a block. Stamping `now` makes the hook's
   * lower bound `block.timestamp < claimAt` revert at simulation, even though the
   * real tx (mined into a FUTURE block) would pass. Defaults to the wall clock
   * when omitted (keeps non-penalty paths and the golden vectors unchanged).
   */
  claimAt?: bigint
}): Hash => {
  const { configurationIndex, strategies, fallbackHook, claimable, coinFlipChoice } = params

  // One timestamp for the whole call so multiple penalty strategies agree (the
  // contract tolerates 60s skew). Prefer the caller-supplied on-chain block
  // timestamp; fall back to the wall clock. Stamped once here, not per-item.
  const claimAt = params.claimAt ?? BigInt(Math.floor(Date.now() / 1000))
  const encode = (hookType: HookType, amount: bigint): Hash =>
    HOOK_STRATEGY_ENCODERS[hookType].encode({
      amount,
      claimAt,
      coinFlipChoice,
    })

  const items: Hash[] = []
  let totalConsumed = 0n

  for (let i = 0; i < strategies.length; i++) {
    if (i === fallbackHook) {
      items.push("0x" as Hash)
      continue
    }
    const { hookType, proportion, consumed } = strategies[i]!
    const hookAmount = (claimable * proportion) / WAD_EVM
    // The fallback receives `claimable - Σ(actual on-chain consumed)`. Most hooks
    // consume their full proportional share, but a linear-penalty hook consumes
    // only `getPenalty(hookAmount)` (it forfeits, delivers nothing) — the caller
    // passes that via `consumed`. Counting the full share here would under-size
    // the fallback transfer → on-chain ConsumedAmountMismatch. The strategy still
    // ENCODES its full share (the penalty hook checks `amount == hookAmount`).
    totalConsumed += consumed ?? hookAmount
    items.push(encode(hookType, hookAmount))
  }

  if (fallbackHook < strategies.length) {
    const fallbackAmount = claimable - totalConsumed
    const { hookType } = strategies[fallbackHook]!
    items[fallbackHook] = encode(hookType, fallbackAmount)
  }

  const hookDataBytes = encodeAbiParameters([{ type: "bytes[]" }], [items])
  return concatHex([numberToHex(configurationIndex, { size: 1 }), hookDataBytes])
}
