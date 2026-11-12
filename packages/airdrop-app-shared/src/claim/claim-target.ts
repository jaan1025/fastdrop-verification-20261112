/**
 * The chain-free, arm-free claim identity type (§6.4, analysis D13). `ClaimTarget`
 * is the identity intersection threaded WHOLE through the claim flow (modal → leaf
 * → hook), killing the legacy ~13-prop drill. Homed in the kernel so BOTH the
 * admin kit (`@repo/console-app-shared`) AND the portal import the
 * SAME type — the portal cannot import console-kit, so neither side may own it.
 *
 * BANNED from `ClaimTarget`: per-surface `copy`/`entityLabel`, the EVM
 * `onBehalfOf` vs Solana connected-wallet semantics, and the chain-discriminated
 * claim payload — those live in each consumer's own `ClaimPayload`/
 * `PortalClaimChain` union (one mapper per side), never here. Pure type-only
 * module; no chain SDK imports, no runtime deps.
 */
export interface ClaimTarget {
  /** Recipient address the claim is credited to. */
  recipient: string
  /** Allocation address-handler key (may be a non-address identifier). */
  handler: string
  /** Batch name. */
  batch: string
  /** Claimable amount shown in the review surface. */
  amount: number
  /** Token symbol. */
  symbol: string
}
