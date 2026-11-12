/**
 * Input types for the Merkle recompute facade. `chainKind: ChainKind` is passed as
 * the first positional arg to the facade functions, not embedded here, so the
 * input shape stays chain-free.
 */

export interface MerkleLeafInput {
  /** The allocation address-handler (EVM address or string identifier, e.g. a twitterId). */
  handler: string
  /** Allocation amount in raw token units. */
  amount: bigint
}

export interface MerkleRootInput {
  /** Merkle proof from the public `/allocations` endpoint. */
  proof: `0x${string}`[]
  /** The allocation address-handler. */
  handler: string
  /** Allocation amount in raw token units. */
  amount: bigint
}
