/**
 * Per-stream revocation truth recovered from chain history (Solana
 * `RevokeStreamEvent` in the closed PDA's tx history / EVM `StreamRevoked` +
 * Σ `StreamClaimed` logs). `undefined` as a whole = not fetched / unavailable.
 *
 * Lives with the stream family: both lock programs erase the stream record on
 * their terminal paths (EVM deletes on full claim AND revoke; Solana closes on
 * revoke), so "what really happened" is only recoverable from history — this is
 * the shape that recovered truth travels in.
 */
export interface StreamRevocationInfo {
  revoked: boolean
  /** Recipient's true lifetime received total (raw units); undefined = history
   * unavailable — display as unknown, never as the full allocation. */
  claimedAmount: bigint | undefined
}
