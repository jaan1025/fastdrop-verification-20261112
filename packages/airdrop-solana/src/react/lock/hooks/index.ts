// clique-lock hooks sub-barrel — thin `use*` hooks paired with the
// query/mutation factories + types they consume (re-exported from `query/`).
// Surfaced to the app via /react. NOTE: the stream + revocation READ hooks moved
// to react/distributor/strategies/lock/hooks (distributor-side bridge); what
// remains is lock-standalone: the pre-claim claimable-amount read + revoke
// mutation.
export { useClaimableAmount, type UseClaimableAmountParameters } from "./use-claimable-amount"

export { useRevokeStream, type UseRevokeStreamParameters } from "./use-revoke-stream"
