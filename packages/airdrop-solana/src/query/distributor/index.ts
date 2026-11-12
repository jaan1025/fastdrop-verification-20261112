// merkle-distributor query/mutation factories + their data/key types — the
// React-free `query/` layer. Thin `use*` hooks live in `react/distributor`.
export {
  solanaDistributorQueryOptions,
  type SolanaDistributorData,
  type SolanaDistributorQueryKey,
} from "./distributor"
export {
  solanaMerkleRootQueryOptions,
  type SolanaMerkleRootData,
  type SolanaMerkleRootQueryKey,
} from "./merkle-root"
export {
  solanaConsumptionQueryOptions,
  type SolanaConsumption,
  type SolanaConsumptionData,
  type SolanaConsumptionQueryKey,
} from "./consumption"
export {
  solanaConfiguratorsQueryOptions,
  type ConfiguratorInfo,
  type SolanaConfiguratorsResult,
  type SolanaConfiguratorsData,
  type SolanaConfiguratorsQueryKey,
} from "./configurators"
export {
  solanaConfigurationQueryOptions,
  type SolanaConfigurationData,
  type SolanaConfigurationQueryKey,
} from "./configuration"
export {
  solanaClaimTimeQueryOptions,
  type SolanaClaimTimeData,
  type SolanaClaimTimeQueryKey,
} from "./claim-time"
export {
  solanaClaimStatusPdaQueryOptions,
  type SolanaClaimStatusPdaData,
  type SolanaClaimStatusPdaQueryKey,
} from "./claim-status-pda"
export {
  solanaStreamPresetQueryOptions,
  type SolanaStreamPresetQueryResult,
  type SolanaStreamPresetData,
  type SolanaStreamPresetQueryKey,
} from "./stream-preset"
export {
  solanaFeeConfigQueryOptions,
  type SolanaFeeConfigData,
  type SolanaFeeConfigQueryKey,
} from "./fee-config"
// Lock STRATEGY reads (bridge: streamId derived from distributor inputs). Live
// under distributor/strategies/lock, surfaced through the same `./query` door.
export {
  solanaStreamQueryOptions,
  type SolanaStreamQueryResult,
  type SolanaStreamData,
  type SolanaStreamQueryKey,
  solanaStreamRevocationQueryOptions,
  type SolanaStreamRevocation,
  type SolanaStreamRevocationQueryKey,
} from "./strategies/lock"
