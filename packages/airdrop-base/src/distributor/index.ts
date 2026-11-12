// Curated barrel for the `@repo/airdrop-base/distributor` subpath — the
// DISTRIBUTOR family: the merkle claim gate (allocation / configurators / fee)
// + the distributor-side strategy assets (stream preset, configuration-code
// identity) + the ACS batch conventions. May compose `stream/` + `scale`. No
// `export *` — every public symbol is named; leaf internals (merkle arms, fee
// arms) stay private behind their sub-barrels.

// -- allocation (merkle claim kernel) ----------------------------------------
export {
  computeMerkleRoot,
  computeMerkleRootFromHandlerHash,
  deriveHandlerHash,
  deriveSolanaHandlerHash,
} from "./allocation"
export type { MerkleRootInput, MerkleLeafInput } from "./allocation"

// -- configurators (root ↔ configuration-id identity) ------------------------
export { expectedConfigurators, configuratorsMatch } from "./configurators"

// -- batch (ACS batch conventions: revoke signal + live schedule code) --------
export { isBatchRevoked, resolveBatchStatus, resolveBatchScheduleCode } from "./batch"
export type { ResolvedBatchStatus } from "./batch"

// -- configuration-code (deterministic airdrop configuration identity) --------
// The vesting scheduleCode grammar (`deriveScheduleCode` et al.) and the composed
// `deriveSchedule` are schedule-DSL identities — they live behind the schedule door.
export { deriveConfigurationCode, hashConfigurationCode } from "./configuration-code"
export type {
  ConfigurationCodeInput,
  StrategyCodeInput,
  LockHookConfigInput,
  PenaltyConfigInput,
  ConfigTimeUnit,
  ConfigInterval,
} from "./configuration-code"

// -- stream preset (distributor-side asset on both chains) --------------------
export {
  normalizeEvmStreamPreset,
  normalizeSolanaStreamPreset,
  flexibleStartSentinel,
  streamTermsFromEvmPreset,
  streamTermsFromSolanaPreset,
} from "./preset"
export type { NormalizedPreset, EvmStreamPresetWire, SolanaStreamPresetWire } from "./preset"

// -- strategy (the `_execute` mirror: consumed → claimed/forfeited/locked) -----
// `consumed` = the on-chain ledger the contracts misname `claimed`; `claimed`
// here strictly means "landed in the wallet". Quote (`configurationClaimable`)
// and attribution (`configurationClaimed`) decompose a claim per strategy.
export { configurationClaimable } from "./strategy/claimable"
export { configurationClaimed } from "./strategy/claimed"
export { outcomeTotals, zeroOutcomeTotals } from "./strategy/execute"
export type { ConfigurationOutcome } from "./strategy/execute"
export { strategyShare } from "./strategy/split"
// Per-strategy outcomes — ONE evaluation each; the quote and the attribution
// are the same function at different instants (hooks are pure in
// (slice, terms, instant)).
export { transferOutcome } from "./strategy/transfer/outcome"
export { penaltyOutcome, penaltyAmountAt } from "./strategy/linear-penalty/outcome"
export { evmPenaltyAmount } from "./strategy/linear-penalty/penalty-evm"
export { solanaPenaltyAmount, solanaPenaltyRateAt } from "./strategy/linear-penalty/penalty-solana"
export { lockOutcome } from "./strategy/lock/outcome"
export { customOutcome } from "./strategy/custom/outcome"
export type {
  StrategyKind,
  StrategyOutcome,
  TransferOutcome,
  PenaltyOutcome,
  LockOutcome,
  CustomOutcome,
  OutcomeTotals,
  PenaltyTerms,
  ConfigurationStrategy,
  Configuration,
  ClaimRecord,
} from "./strategy/types"

// -- fee codec ---------------------------------------------------------------
export { encodeFeeMode, formatBatchFeeConfig } from "./fee"
export type { BatchFeeConfig } from "./fee"
