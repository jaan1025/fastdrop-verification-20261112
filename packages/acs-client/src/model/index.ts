// The curated `@repo/acs-client/model` public surface — the pure wire model +
// classification grammar + byte contracts. Imports NOTHING from `../transport`,
// `../actions`, `../query`, `../react` (verifiable, one-directional). Named
// re-exports only.

// Wire types
export type {
  AppConf,
  Deployment,
  DeploymentExtra,
  AppConfExtra,
  Batch,
  BatchStatus,
  ConfigurationRecord,
  Strategy,
  LockHookStrategy,
  TransferHookStrategy,
  LinearPenaltyHookStrategy,
  CustomHookStrategy,
  RoleKey,
  Allocation,
  AllocationExtra,
  AllocationResponse,
  AllocationSortKey,
  AllocationSortOrder,
  AllocationInitParams,
  AllocationQueryParams,
  InspectResult,
  AppIdScope,
  WalletSet,
  WalletEntry,
  AddressBindingResult,
  TxStatus,
  TxType,
  TxHistoryRecord,
  TxHistoryResponse,
  TxHistoryFilters,
  TxHistoryQueryParams,
  BatchStat,
  SingleBatchStat,
  SingleScheduleStat,
  RelayerResponse,
  FeeMode,
  SupportedChain,
  HealthResponse,
  ToSResponse,
  JsonPatchOp,
  ParsedRow,
  ParseCsvOptions,
  CsvRowInput,
} from "./types"
export { BATCH_STATUSES } from "./types"

// Chain classification (the single classification point)
export type { ChainKind } from "./chain"
export { resolveChainKind, isEvmChainId, isSolanaChainId } from "./chain"

// Per-chain address equality (ChainKind-dispatched)
export { addressesMatch } from "./address-match"

// Address normalization + format predicates
export {
  normalizeEvmAddress,
  withNormalizedAddresses,
  isEvmAddress,
  isSolanaAddressFormat,
  isWalletAddress,
} from "./address"

// Scope / capability / admin-scope / wire-scope algebra
export {
  parseScope,
  maxAllMutability,
  meetsLevel,
  resolveOrgCapability,
  aggregateCapability,
  toWireScope,
  ADMIN_SCOPE,
  isAdminScoped,
} from "./scope"
export type {
  Mutability,
  CapabilityLevel,
  ParsedScope,
  ResolveOrgCapabilityInput,
  WireScope,
  OrgScope,
} from "./scope"

// JSON-Patch helpers
export { patchOp, escapeJsonPointerSegment, batchRootPath, configurationsPath } from "./json"

// Allocation byte contracts (CSV build/parse + schedule-code)
export {
  buildCsv,
  deriveBatchName,
  CSV_HEADER,
  buildMerkleLeafTemplate,
  PRIMARY_KEY,
  parseCsv,
  MAX_CSV_ROWS,
  dedupeAndSumRows,
  normalizeScheduleCode,
  splitScheduleCode,
} from "./allocation"

// ConfigurationRecord helpers
export { configFixedStart } from "./configuration"

// Schedule-code display-name resolution (compound-code aware)
export { resolveScheduleName } from "./schedule-name"

// Tx-type → human display label + the canonical filter-dropdown options
export { txTypeLabel, TX_TYPE_OPTIONS } from "./tx-type-label"

// ToS message byte contract
export { buildToSMessage, buildTosHash } from "./tos-message"

// sha256 byte contract
export { sha256Hex } from "./sha256"

// Deployment product (airdrop vs vesting) classification — the product-scope
// convention (`type !== "vesting"` ⇒ airdrop) the consoles key off.
export {
  resolveDeploymentProduct,
  isAirdropDeployment,
  isVestingDeployment,
  type DeploymentProduct,
} from "./deployment-product"
