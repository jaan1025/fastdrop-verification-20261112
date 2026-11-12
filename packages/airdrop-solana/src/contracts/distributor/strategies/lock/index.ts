// Lock STRATEGY — the distributor's lock-hook bridge. On-chain the lock program
// (clique-lock) is standalone; the bridge lives in the DISTRIBUTOR program, whose
// claim CPIs into clique-lock's `create_nft_bound_stream` (NOT the plain
// `create_stream`, which is standalone-lock only). `streamId` is the
// distributor-side deterministic identity `keccak256(distributor‖root‖recipient)`
// (see ./stream-id) — passed to the lock program as a parameter, so these files
// derive it from distributor inputs and read the resulting lock stream account.
export {
  buildLockHookRemainingAccounts,
  prepareLockHookContext,
  LOCK_HOOK_ACCOUNT_COUNT,
  type LockHookAccountInputs,
  type PrepareLockHookContextParams,
} from "./lock-hook-accounts"
export { lockHookClaim, type LockHookClaimContext } from "./lock-hook-claim"
export { deriveStreamId } from "./stream-id"
