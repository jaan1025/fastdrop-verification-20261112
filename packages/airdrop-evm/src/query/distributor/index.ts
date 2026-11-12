// Distributor query layer — queryOptions/mutationOptions factories + data/key/
// param types. React-free; the thin `use*` hooks that consume these live in
// `react/distributor/hooks`.

// ── reads (hand-rolled queryOptions factories) ────────────────────────────────
export {
  evmVaultQueryOptions,
  type EvmVaultData,
  type EvmVaultQueryKey,
  type UseVaultParameters,
} from "./vault"
export {
  evmTokenQueryOptions,
  type EvmTokenData,
  type EvmTokenQueryKey,
  type UseTokenParameters,
} from "./token"
export {
  evmActiveQueryOptions,
  type EvmActiveData,
  type EvmActiveQueryKey,
  type UseActiveParameters,
} from "./active"
export {
  evmDynamicRecipientQueryOptions,
  type EvmDynamicRecipientData,
  type EvmDynamicRecipientQueryKey,
  type UseDynamicRecipientParameters,
} from "./dynamic-recipient"
export {
  evmFeeModeQueryOptions,
  type EvmFeeModeData,
  type EvmFeeModeQueryKey,
  type UseFeeModeParameters,
} from "./fee-mode"
export {
  evmFixedFeeQueryOptions,
  type EvmFixedFeeData,
  type EvmFixedFeeQueryKey,
  type UseFixedFeeParameters,
} from "./fixed-fee"
export {
  evmSingleTierFeeRateQueryOptions,
  type EvmSingleTierFeeRateData,
  type EvmSingleTierFeeRateQueryKey,
  type UseSingleTierFeeRateParameters,
} from "./single-tier-fee-rate"
export {
  evmConfigurationIdsQueryOptions,
  type EvmConfigurationIdsData,
  type EvmConfigurationIdsQueryKey,
  type UseConfigurationIdsParameters,
} from "./configuration-ids"

// ── reads (hand-rolled queryOptions) ──────────────────────────────────────────
export {
  evmMerkleRootQueryOptions,
  type EvmMerkleRootData,
  type EvmMerkleRootQueryKey,
  type UseMerkleRootParameters,
} from "./merkle-root"
export {
  evmConsumptionQueryOptions,
  type EvmConsumptionData,
  type EvmConsumptionQueryKey,
  type UseConsumptionParameters,
} from "./consumption"
export {
  evmConfigurationQueryOptions,
  type EvmConfigurationData,
  type EvmConfigurationQueryKey,
  type UseConfigurationParameters,
} from "./configuration"
export {
  evmClaimedTransactionHashQueryOptions,
  type EvmClaimedTransactionHashData,
  type EvmClaimedTransactionHashQueryKey,
  type UseClaimedTransactionHashParameters,
} from "./claimed-transaction-hash"

// ── claim mutations ───────────────────────────────────────────────────────────
// (All distributor claim FLOW mutation factories were removed — every claim flow
//  is now sequenced in the app-layer FACADES (`@repo/airdrop-app-shared/claim/hooks`)
//  over the EVM contract PRIMITIVES directly; only read query factories remain.)
