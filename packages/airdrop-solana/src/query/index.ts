// `query/` door — every Clique distributor + lock queryOptions/mutationOptions
// factory and its data/key types, plus the Clique program query keys. React-free;
// the thin `use*` hooks that consume these live in `react/`. Curated named list
// (NOT `export *`), mirroring the EVM `./query` door.

// ── distributor ───────────────────────────────────────────────────────────────
export {
  solanaDistributorQueryOptions,
  type SolanaDistributorData,
  type SolanaDistributorQueryKey,
  solanaMerkleRootQueryOptions,
  type SolanaMerkleRootData,
  type SolanaMerkleRootQueryKey,
  solanaConsumptionQueryOptions,
  type SolanaConsumption,
  type SolanaConsumptionData,
  type SolanaConsumptionQueryKey,
  solanaConfiguratorsQueryOptions,
  type ConfiguratorInfo,
  type SolanaConfiguratorsResult,
  type SolanaConfiguratorsData,
  type SolanaConfiguratorsQueryKey,
  solanaConfigurationQueryOptions,
  type SolanaConfigurationData,
  type SolanaConfigurationQueryKey,
  solanaClaimTimeQueryOptions,
  type SolanaClaimTimeData,
  type SolanaClaimTimeQueryKey,
  solanaClaimStatusPdaQueryOptions,
  type SolanaClaimStatusPdaData,
  type SolanaClaimStatusPdaQueryKey,
  solanaStreamPresetQueryOptions,
  type SolanaStreamPresetQueryResult,
  type SolanaStreamPresetData,
  type SolanaStreamPresetQueryKey,
  solanaFeeConfigQueryOptions,
  type SolanaFeeConfigData,
  type SolanaFeeConfigQueryKey,
  solanaStreamQueryOptions,
  type SolanaStreamQueryResult,
  type SolanaStreamData,
  type SolanaStreamQueryKey,
  solanaStreamRevocationQueryOptions,
  type SolanaStreamRevocation,
  type SolanaStreamRevocationQueryKey,
} from "./distributor"

// ── lock ──────────────────────────────────────────────────────────────────────
export {
  solanaClaimableAmountQueryOptions,
  type SolanaClaimableAmountResult,
  type SolanaClaimableAmountData,
  type SolanaClaimableAmountQueryKey,
  solanaRevokeStreamMutationOptions,
  type UseRevokeStreamParams,
  type RevokeStreamData,
} from "./lock"

// ── Clique query keys ─────────────────────────────────────────────────────────
export { airdropSolanaKeys } from "./keys"
