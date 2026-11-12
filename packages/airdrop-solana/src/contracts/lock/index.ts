// Curated CliqueLock family sub-barrel — the pure CliqueLock program API (no
// React hooks; those are surfaced via /react). Composed into the package's
// `./contracts` entry alongside the distributor family.
export { getStreamPDA, getNftBindingPDA, getStreamIdPDA } from "./functions/pda"
export {
  fetchStream,
  fetchNftBinding,
  isNftBoundStream,
  type Stream,
  type NftBinding,
} from "./functions/fetch"
// NOTE: `deriveStreamId` + `lockHookClaim` are NOT lock-standalone — they are the
// distributor's lock-hook bridge (keyed off the distributor PDA) and now live in
// `distributor/strategies/lock`, surfaced through the same `./contracts`
// door. clique-lock is standalone on-chain; the bridge sits in the distributor.
export { REVOKE_STREAM_EVENT_DISCRIMINATOR, findRevokeStreamEventInLogs } from "./functions/events"
export { type RevokeStreamEvent } from "./generated/types/revokeStreamEvent"
export {
  calculateClaimableAmount,
  getClaimableAmount,
  assembleClaimableMetrics,
  type ClaimableMetrics,
} from "./functions/claimable-math"
export { buildClaimLockedInstructions, type BuildClaimLockedContext } from "./functions/build-claim"
export {
  buildRevokeStreamInstructions,
  type BuildRevokeStreamContext,
} from "./functions/build-revoke"
export { revokeStream, type RevokeStreamContext } from "./functions/revoke-stream"
export { CLIQUE_LOCK_PROGRAM_ADDRESS } from "./generated/programs/cliqueLock"
