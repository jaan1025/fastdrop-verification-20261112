// Distributor react hooks barrel. Hooks live here; the queryOptions/
// mutationOptions factories + data/key/param types come from `query/distributor`
// (re-exported for an unchanged public surface).

// ── claim mutations ───────────────────────────────────────────────────────────
// (All distributor claim FLOW mutations were removed — every claim flow is now
//  sequenced in the app-layer FACADES (`@repo/airdrop-app-shared/claim/hooks`)
//  over the EVM contract PRIMITIVES directly; only reads remain here.)

// ── reads ─────────────────────────────────────────────────────────────────────
export { useMerkleRoot } from "./use-merkle-root"
export { type UseMerkleRootParameters } from "../../../query/distributor"

export { useConsumption } from "./use-consumption"
export { type UseConsumptionParameters } from "../../../query/distributor"

export { useConfiguration } from "./use-configuration"
export { type UseConfigurationParameters } from "../../../query/distributor"

export { useClaimedTransactionHash } from "./use-claimed-transaction-hash"
export { type UseClaimedTransactionHashParameters } from "../../../query/distributor"

export { useConfigurationIds } from "./use-configuration-ids"
export { type UseConfigurationIdsParameters } from "../../../query/distributor"

export { useVault } from "./use-vault"
export { useToken } from "./use-token"
export { useActive } from "./use-active"
export { useDynamicRecipient } from "./use-dynamic-recipient"
export { useFeeMode } from "./use-fee-mode"
export { useFixedFee } from "./use-fixed-fee"
export { useSingleTierFeeRate } from "./use-single-tier-fee-rate"
export { useFeeConfig, type UseFeeConfigParameters } from "./use-fee-config"
export {
  type UseVaultParameters,
  type UseTokenParameters,
  type UseActiveParameters,
  type UseDynamicRecipientParameters,
  type UseFeeModeParameters,
  type UseFixedFeeParameters,
  type UseSingleTierFeeRateParameters,
} from "../../../query/distributor"
