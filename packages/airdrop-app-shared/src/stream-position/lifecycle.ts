/** The lifecycle phases the pure resolver returns. */
export type StreamLifecycle = "terminal-claimed" | "terminal-revoked" | "pre-claim" | "live"

/**
 * PURE, chain-free 3-state lifecycle resolver. Decides which lifecycle branch a
 * position is in from a tiny input — unit-testable without React or any chain
 * SDK. The single home for the branch the two portal leaves used to inline three
 * ways each.
 *
 * - `live` — a live on-chain stream record exists.
 * - `terminal-claimed` — no live stream, but a prior on-chain claim is recorded
 *   (the stream was deleted/closed; everything claimed).
 * - `terminal-revoked` — no live stream and no prior claim, but the batch was
 *   revoked (app_conf `configuration` emptied): the allocation was clawed back
 *   before any claim. Definite zeros, NOT a preset estimate — a revoked batch's
 *   schedule code is gone, so `pre-claim` would have no preset and stall on a
 *   skeleton forever.
 * - `pre-claim` — no stream, no prior claim, not revoked; metrics are
 *   preset-estimated.
 *
 * Order matters: `hasClaimed` outranks `isRevoked` so a revoke-after-claim keeps
 * the `terminal-claimed` reading (the recipient did receive those tokens).
 */
export function resolveStreamLifecycle(input: {
  hasStream: boolean
  hasClaimed: boolean
  hasPreset: boolean
  isRevoked: boolean
}): StreamLifecycle {
  if (input.hasStream) return "live"
  if (input.hasClaimed) return "terminal-claimed"
  if (input.isRevoked) return "terminal-revoked"
  return "pre-claim"
}
