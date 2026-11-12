// Distributor STRATEGY family — the merkle-distributor's weighted `Strategy[]`
// composition (on-chain HookType enum: Transfer / Lock / Penalty). The
// cross-strategy `claim.extra` byte pipeline lives at this root — the per-hook
// encoders, the `consumed` predictors, and the extra-blob assembler all dispatch
// across every HookType, so they are shared, not per-strategy. The per-strategy
// account builders + math live under ./lock and ./penalty (Transfer needs no
// dedicated builder — its `_extra` is the plain u64 amount encoder here).
export { buildClaimExtra } from "./claim-extra"
export { serializeStrategyData, serializeHookDataInput } from "./hook-encoders"
// Solana set-hook wire-name map (S6 sink from airdrop-console create flow).
export { SOLANA_HOOK_NAME, type StrategyHookKind } from "./hook-names"
export {
  HOOK_CONSUMED_RESOLVERS,
  resolveHookConsumed,
  type HookConsumedResolver,
  type HookConsumedContext,
} from "./hook-consumed"
// On-chain batch config → base `Configuration` (feeds the base
// `configurationClaimable` / `configurationClaimed` decomposition).
export { resolveConfiguration, STRATEGY_KIND_BY_HOOK_TYPE } from "./configuration"
export * from "./lock"
export * from "./penalty"
