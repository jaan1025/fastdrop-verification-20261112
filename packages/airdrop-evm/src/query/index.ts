// `query/` layer — every Clique distributor / lock / lock-hook / cap
// queryOptions/mutationOptions factory and its data/key/param types, plus the
// Clique contract query keys. React-free; the thin `use*` hooks that consume
// these live in `react/`. The internal kit read/write bundles (`*Read` /
// `*Write`) are NOT surfaced here — they are a private seam for `react/`.

// ── distributor ───────────────────────────────────────────────────────────────
export {
  evmVaultQueryOptions,
  type EvmVaultData,
  type UseVaultParameters,
  evmTokenQueryOptions,
  type EvmTokenData,
  type UseTokenParameters,
  evmActiveQueryOptions,
  type EvmActiveData,
  type UseActiveParameters,
  evmDynamicRecipientQueryOptions,
  type EvmDynamicRecipientData,
  type UseDynamicRecipientParameters,
  evmFeeModeQueryOptions,
  type EvmFeeModeData,
  type UseFeeModeParameters,
  evmFixedFeeQueryOptions,
  type EvmFixedFeeData,
  type UseFixedFeeParameters,
  evmSingleTierFeeRateQueryOptions,
  type EvmSingleTierFeeRateData,
  type UseSingleTierFeeRateParameters,
  evmConfigurationIdsQueryOptions,
  type EvmConfigurationIdsData,
  type EvmConfigurationIdsQueryKey,
  type UseConfigurationIdsParameters,
  evmMerkleRootQueryOptions,
  type EvmMerkleRootData,
  type EvmMerkleRootQueryKey,
  type UseMerkleRootParameters,
  evmConsumptionQueryOptions,
  type EvmConsumptionData,
  type EvmConsumptionQueryKey,
  type UseConsumptionParameters,
  evmConfigurationQueryOptions,
  type EvmConfigurationData,
  type EvmConfigurationQueryKey,
  type UseConfigurationParameters,
  evmClaimedTransactionHashQueryOptions,
  type EvmClaimedTransactionHashData,
  type EvmClaimedTransactionHashQueryKey,
  type UseClaimedTransactionHashParameters,
} from "./distributor"

// ── lock ────────────────────────────────────────────────────────────────────
export {
  evmStreamQueryOptions,
  type EvmStreamData,
  type EvmStreamQueryKey,
  type UseStreamParameters,
  evmClaimableAmountQueryOptions,
  type EvmClaimableAmountData,
  type EvmClaimableAmountQueryKey,
  type UseClaimableAmountParameters,
  evmRevokeStreamMutationOptions,
  type RevokeStreamParams,
  type RevokeStreamData,
} from "./lock"

// ── lock-hook ─────────────────────────────────────────────────────────────────
export {
  evmStreamIdQueryOptions,
  type EvmStreamIdData,
  type EvmStreamIdQueryKey,
  type UseStreamIdParameters,
  evmStreamPresetQueryOptions,
  type EvmStreamPresetData,
  type EvmStreamPresetQueryKey,
  type UseStreamPresetParameters,
  evmSetStreamPresetMutationOptions,
  type SetStreamPresetParams,
  type SetStreamPresetData,
  type StreamPreset,
} from "./distributor/strategies/lock-hook"

// ── transfer-with-cap-hook ────────────────────────────────────────────────────
export {
  evmTransferCapQueryOptions,
  type EvmTransferCapData,
  type EvmTransferCapQueryKey,
  type UseTransferCapParameters,
} from "./distributor/strategies/transfer-with-cap-hook"

// ── Clique query keys ─────────────────────────────────────────────────────────
export { airdropEvmKeys } from "./keys"
