// CliqueLock query layer — read queryOptions + revoke mutationOptions factories.
// React-free; the thin `use*` hooks that consume these live in `react/lock/hooks`.
export {
  evmStreamQueryOptions,
  type EvmStreamData,
  type EvmStreamQueryKey,
  type UseStreamParameters,
} from "./stream"
export {
  evmClaimableAmountQueryOptions,
  type EvmClaimableAmountData,
  type EvmClaimableAmountQueryKey,
  type UseClaimableAmountParameters,
} from "./claimable-amount"
export {
  evmStreamRevocationQueryOptions,
  type EvmStreamRevocation,
  type EvmStreamRevocationQueryKey,
  type UseStreamRevocationParameters,
} from "./stream-revocation"
export {
  evmRevokeStreamMutationOptions,
  type RevokeStreamParams,
  type RevokeStreamData,
} from "./revoke-stream"
