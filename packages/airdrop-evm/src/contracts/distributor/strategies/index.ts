// Distributor STRATEGY family — the cross-strategy `claim.extra` byte pipeline
// lives at this root (the per-hook encoders, the `consumed` predictors, and
// the extra-blob assemblers all dispatch across every HookType, so they are
// shared, not per-strategy — mirrors the Solana arm's `strategies/` layout).
// Per-strategy assets live under `./linear-penalty-hook`, `./lock-hook`,
// `./transfer-hook`, `./transfer-with-cap-hook`, `./transfer-or-coin-flip-hook`.
// `[golden]` — the ACS-signed `extra` and the on-chain-verified `extra` MUST
// stay byte-identical (co-signature fails otherwise); these encoders are
// pinned by golden tests.
export {
  buildEvmClaimExtra,
  resolveHookType,
  resolveKnownHookType,
  type HookType,
  type HookContracts,
} from "./claim-extra"
export { HOOK_STRATEGY_ENCODERS, type HookStrategyEncoder } from "./hook-encoders"
export {
  HOOK_CONSUMED_RESOLVERS,
  resolveHookConsumed,
  type HookConsumedResolver,
  type HookConsumedContext,
} from "./hook-consumed"
export { buildEvmDistributorClaimExtra } from "./build-distributor-claim-extra"
export { buildEvmForcedTransferClaimExtra } from "./build-forced-transfer-claim-extra"
