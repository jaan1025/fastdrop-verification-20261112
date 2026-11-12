// clique-lock query/mutation factories + their data/key types — the React-free
// `query/` layer. Thin `use*` hooks live in `react/lock`. NOTE: the stream +
// revocation READS moved to `query/distributor/strategies/lock` (they derive the
// streamId from distributor inputs = distributor-side bridge reads); what remains
// here is lock-standalone: the pre-claim claimable-amount read + the revoke
// mutation.
export {
  solanaClaimableAmountQueryOptions,
  type SolanaClaimableAmountResult,
  type SolanaClaimableAmountData,
  type SolanaClaimableAmountQueryKey,
} from "./claimable-amount"
export {
  solanaRevokeStreamMutationOptions,
  type UseRevokeStreamParams,
  type RevokeStreamData,
} from "./revoke-stream"
