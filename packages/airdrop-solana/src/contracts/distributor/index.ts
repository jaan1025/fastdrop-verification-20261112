// Curated MerkleDistributor family sub-barrel — the pure MerkleDistributor
// program API (no React hooks; those are surfaced via /react). Composed into the
// package's `./contracts` entry alongside the lock family.
export {
  prepareSolanaClaimExtra,
  type PrepareClaimExtraInput,
  type PrepareClaimExtraResult,
} from "./functions/prepare-claim-extra"
export { buildClaimExtra } from "./strategies/claim-extra"
export { solanaHandlerBytes, computeSolanaRoot } from "./functions/merkle"
export { resolveDeployedDistributor } from "./functions/resolve-deployed-distributor"
export { calculateRequiredFee } from "./functions/fee"
export { resolveConfigurators, type ConfiguratorInfo } from "./functions/configurator"
// On-chain batch config → base `Configuration` (+ the PenaltyConfig →
// PenaltyTerms lift). The penalty curve math itself lives in
// `@repo/airdrop-base/distributor`.
export { resolveConfiguration, STRATEGY_KIND_BY_HOOK_TYPE } from "./strategies/configuration"
export { solanaPenaltyTerms } from "./strategies/penalty"
// SPL vault → distributor delegated-allowance decode (S5 sink from console).
export { resolveDistributorAllowance } from "./functions/vault-allowance"
export {
  getDistributorPDA,
  getClaimRootPDA,
  getClaimStatusPDA,
  getFeeConfigPDA,
  getBatchConfigPDA,
  getStreamPresetPDA,
  getPenaltyConfigPDA,
} from "./functions/pda"
export {
  fetchMerkleDistributor,
  fetchClaimStatus,
  fetchClaimRoot,
  fetchFeeConfig,
  fetchBatchConfig,
  fetchStreamPreset,
  fetchPenaltyConfig,
  getClaimStatus,
} from "./functions/fetch"
export {
  distributorClaim,
  buildClaimInstructions,
  buildClaimCacheKey,
  getNftMintPDA,
  type BuildClaimContext,
  type DistributorClaimContext,
} from "./functions/claim"
// Lock STRATEGY (the distributor's lock-hook bridge). `deriveStreamId` +
// `lockHookClaim` moved here from the lock family — they are keyed off the
// distributor PDA (streamId = keccak(distributor‖root‖recipient)), which fixes the
// former lock→distributor dependency-rule violation.
export {
  buildLockHookRemainingAccounts,
  prepareLockHookContext,
  LOCK_HOOK_ACCOUNT_COUNT,
  deriveStreamId,
  lockHookClaim,
  type LockHookClaimContext,
} from "./strategies/lock"
export { buildPenaltyHookRemainingAccounts } from "./strategies/penalty"
// Solana set-hook wire-name map (the app resolves a strategy's on-chain hook
// literal from it; S6 sink from the airdrop-console create flow).
export { SOLANA_HOOK_NAME, type StrategyHookKind } from "./strategies/hook-names"
export {
  collectProjectLutAddresses,
  buildProjectLutAddresses,
  type CollectProjectLutAddressesParams,
  type ProjectLutInput,
} from "./functions/lut/collect-project-lut-addresses"
export { MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS } from "./generated/programs/merkleDistributor"
export type { StreamPreset } from "./generated/accounts/streamPreset"
export type { Strategy } from "./generated/types/strategy"
export { HookType } from "./generated/types/hookType"
