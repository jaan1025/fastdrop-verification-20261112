import { type Hash, encodeAbiParameters } from "viem"

/**
 * [golden-test] The single byte home for per-strategy `extra` ABI encoding
 * (analysis 6.5 — collapses the five per-hook `getHookExtra`/`encode*Data`
 * copies that were split between the legacy `hook-data.ts` and each
 * `<hook>/functions.ts`). A descriptor registry keyed by `HookType`;
 * `buildEvmClaimExtra` dispatches into it. EVM-only byte contract — the Solana
 * twin lives in `@repo/airdrop-solana`.
 */

/** Logical hook strategy kind. */
export type HookType =
  "transfer" | "transfer-with-cap" | "transfer-or-coin-flip" | "lock" | "linear-penalty"

/** One registry entry's encode contract. */
export interface HookStrategyEncoder {
  /** ABI-encodes this strategy's `extra` bytes from the per-strategy split amount. */
  encode: (input: { amount: bigint; claimAt?: bigint; coinFlipChoice?: bigint }) => Hash
}

const encodeAmountData = (amount: bigint): Hash =>
  encodeAbiParameters([{ type: "uint256" }], [amount])

const encodePenaltyData = (amount: bigint, claimAt: bigint): Hash =>
  encodeAbiParameters([{ type: "uint256" }, { type: "uint256" }], [amount, claimAt])

const encodeCoinFlipData = (choice: bigint, amount: bigint): Hash =>
  encodeAbiParameters([{ type: "uint256" }, { type: "uint256" }], [choice, amount])

/**
 * [golden-test] The registry. `transfer`/`transfer-with-cap`/`lock` encode a
 * single `uint256` amount; `linear-penalty` encodes `(amount, claimAt)` (claimAt
 * stamped at the current client timestamp — the contract tolerates 60s skew);
 * `transfer-or-coin-flip` encodes `(choice, amount)`.
 */
export const HOOK_STRATEGY_ENCODERS: Record<HookType, HookStrategyEncoder> = {
  transfer: { encode: ({ amount }) => encodeAmountData(amount) },
  "transfer-with-cap": { encode: ({ amount }) => encodeAmountData(amount) },
  lock: { encode: ({ amount }) => encodeAmountData(amount) },
  "linear-penalty": {
    encode: ({ amount, claimAt }) =>
      encodePenaltyData(amount, claimAt ?? BigInt(Math.floor(Date.now() / 1000))),
  },
  "transfer-or-coin-flip": {
    encode: ({ amount, coinFlipChoice }) => encodeCoinFlipData(coinFlipChoice ?? 0n, amount),
  },
}
