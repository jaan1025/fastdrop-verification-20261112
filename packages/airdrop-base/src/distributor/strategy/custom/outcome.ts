import type { CustomOutcome } from "../types"

/**
 * Outcome for an unknown/custom hook. Its on-chain semantics are opaque, so
 * this ASSUMES full delivery (consumed == claimed) — the same assumption the
 * claim builders' consumed-resolvers make (transfer-with-cap / coin-flip /
 * custom all predict full-share consumption). If a custom hook forfeits or
 * locks, its numbers will be attributed as claimed; that is the documented
 * limit of the model, not a bug elsewhere.
 */
export function customOutcome(hookAmount: bigint): CustomOutcome {
  return {
    kind: "customHook",
    // ASSUMED full-slice consumption — the same prediction the claim-path
    // consumed-resolvers make for unknown hooks.
    consumed: hookAmount,
    // ASSUMED delivered in full. An unknown hook that actually forfeits or
    // locks is still reported as claimed — the documented limit of the model.
    claimed: hookAmount,
  }
}
