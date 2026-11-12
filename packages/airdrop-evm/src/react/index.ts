// `./react` barrel — HOOKS ONLY. Every Clique contract React hook — distributor
// (claim / reads / fee reads / strategy configuration), lock (stream /
// claimable / revoke), lock-hook (stream id / preset / claim), and
// transfer-with-cap — plus the
// `Use*Parameters` / `Use*Options` hook-parameter types they take. The
// queryOptions/mutationOptions factories and their data/key types are reached
// via `./query`; the key registry via `./keys`. The generic wallet-flow + ToS
// hooks live in the kit's `@repo/chain-evm-kit/react`.
//
// Curated explicit named list (NOT `export *`), pinned so the public hooks-only
// `/react` surface is reviewable.

// ── distributor ───────────────────────────────────────────────────────────────
export {
  useMerkleRoot,
  type UseMerkleRootParameters,
  useConsumption,
  type UseConsumptionParameters,
  useConfiguration,
  type UseConfigurationParameters,
  useClaimedTransactionHash,
  type UseClaimedTransactionHashParameters,
  useConfigurationIds,
  type UseConfigurationIdsParameters,
  useVault,
  useToken,
  useActive,
  useDynamicRecipient,
  useFeeMode,
  useFixedFee,
  useSingleTierFeeRate,
  useFeeConfig,
  type UseVaultParameters,
  type UseTokenParameters,
  type UseActiveParameters,
  type UseDynamicRecipientParameters,
  type UseFeeModeParameters,
  type UseFixedFeeParameters,
  type UseSingleTierFeeRateParameters,
  type UseFeeConfigParameters,
} from "./distributor/hooks"

// ── lock ────────────────────────────────────────────────────────────────────
export {
  useStream,
  type UseStreamParameters,
  useClaimableAmount,
  type UseClaimableAmountParameters,
  useStreamRevocation,
  type UseStreamRevocationParameters,
  useRevokeStream,
} from "./lock/hooks"
export type { EvmStreamRevocation } from "../query/lock"

// ── lock-hook ─────────────────────────────────────────────────────────────────
export {
  useStreamId,
  type UseStreamIdParameters,
  useStreamPreset,
  type UseStreamPresetParameters,
  useSetStreamPreset,
} from "./distributor/strategies/lock-hook/hooks"

// ── transfer-with-cap-hook ────────────────────────────────────────────────────
export {
  useTransferCap,
  type UseTransferCapParameters,
} from "./distributor/strategies/transfer-with-cap-hook/hooks"
