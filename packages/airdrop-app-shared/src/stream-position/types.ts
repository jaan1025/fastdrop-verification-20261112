export type { StreamRevocationInfo } from "@repo/airdrop-base/stream"

/**
 * The chain-free assembled display metrics produced by the per-chain stream
 * assemblers. No chain SDK / React — a pure normalized view of an already-fetched
 * on-chain (or preset-estimated) stream position.
 */
export interface StreamMetrics {
  /** Whether a live on-chain stream record exists. */
  hasOnChainStream: boolean
  /** Total allocation as a display number (decimal-shifted). */
  amount?: number
  /** Amount the recipient has actually claimed. */
  claimed?: number
  /** Cumulative vested-to-date (claimable + already-claimed). */
  vested?: number
  /** Net releasable right now. */
  claimable?: number
  /**
   * The stream was individually revoked. Solana: a `close`d stream with a prior
   * claim is unambiguously a revoke. EVM: set only when log recovery
   * (`StreamRevoked`) confirms it — the state read alone can't distinguish a
   * revoke from a completed claim.
   */
  streamRevoked?: boolean
  /** On-chain stream's resolved start time (unix sec); set once a stream exists. */
  streamStartTime?: number
  /** On-chain cliff-end time (unix sec); set once a stream exists. */
  streamCliffTime?: number
  /** On-chain full-unlock time (unix sec); set once a stream exists. */
  streamEndTime?: number
  /** Any sub-query in flight. */
  isLoading: boolean
}
