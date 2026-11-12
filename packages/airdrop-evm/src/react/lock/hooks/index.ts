// CliqueLock react hooks barrel. Hooks are the `.useRead`/`.useWrite` halves of
// the kit skeletons, built over the React-free queryOptions/mutationOptions
// factories in `query/lock` (re-exported for an unchanged public surface).

export { useStream } from "./use-stream"
export { useClaimableAmount } from "./use-claimable-amount"
export { useStreamRevocation } from "./use-stream-revocation"
export { useRevokeStream } from "./use-revoke-stream"

export {
  type UseStreamParameters,
  type UseStreamRevocationParameters,
  type UseClaimableAmountParameters,
} from "../../../query/lock"
