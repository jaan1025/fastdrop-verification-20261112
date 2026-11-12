import type { LockOutcome } from "../types"

/**
 * The lock hook consumes its whole slice into a vesting stream — nothing
 * reaches the wallet at claim time, nothing is ever forfeited. The stream's
 * own unlock/claim life-cycle (including the EVM auto-claim of the
 * already-unlocked portion at creation) is the `stream` door's domain,
 * downstream of this outcome; what later left the stream to the wallet is
 * read from the stream itself (`stream.claimedAmount`), never inferred here.
 *
 * ONE evaluation serves both the quote and the attribution: the hook is a
 * pure function of the slice it is handed.
 */
export function lockOutcome(hookAmount: bigint): LockOutcome {
  return {
    kind: "lockHook",
    // The hook's execute() return value — the whole slice is drawn from the
    // vault into the stream it creates.
    consumed: hookAmount,
    // Always 0 IN THE DISTRIBUTOR LEDGER: the claim tx itself delivers nothing
    // to the wallet. Whatever later leaves the stream (vesting claims, the EVM
    // instant-unlock auto-claim at creation) is stream-ledger state
    // (`stream.claimedAmount`) — composed downstream, never counted here.
    claimed: 0n,
    // Locked into the newly created stream at claim time — a one-off historic
    // fact; its subsequent unlock/claim evolution lives in the `stream` door.
    locked: hookAmount,
  }
}
