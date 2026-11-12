// Sub-barrel for the clique-lock hand facade (the split of the legacy
// `functions.ts` god file, analysis H2). Leaves stay private; consumers import
// this barrel or the `/lock` curated facade.

export { getStreamPDA, getNftBindingPDA, getStreamIdPDA } from "./pda"
export {
  fetchStream,
  fetchNftBinding,
  isNftBoundStream,
  type Stream,
  type NftBinding,
} from "./fetch"
// `deriveStreamId` + `lockHookClaim` re-homed to
// `distributor/strategies/lock` (distributor-side bridge). See ./index.
export { REVOKE_STREAM_EVENT_DISCRIMINATOR, findRevokeStreamEventInLogs } from "./events"
export {
  calculateClaimableAmount,
  getClaimableAmount,
  assembleClaimableMetrics,
  type ClaimableMetrics,
} from "./claimable-math"
export { buildClaimLockedInstructions, type BuildClaimLockedContext } from "./build-claim"
export { buildRevokeStreamInstructions, type BuildRevokeStreamContext } from "./build-revoke"
export { revokeStream, type RevokeStreamContext } from "./revoke-stream"
