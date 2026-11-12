import { type ChainKind } from "@repo/acs-client/model"

/**
 * The chain-free result every app-layer claim hook (facade + `-evm`/`-solana`
 * arm) returns. It is the SAME contract the portal/admin modal phase machines
 * already consume — `preflight` (connect + chain-switch, returning the wallet
 * that actually connected), `runClaim` (the chain's faithful claim sequence,
 * returning the landed tx hash/signature), plus the carried `chainKind` and the
 * currently-connected wallet for the address-match guard.
 *
 * No UX side-effects (toast/navigate/open-modal) live here — those belong in the
 * modal handler that drives this result (the NEXT step rewires the modals). The
 * hook only exposes the two awaitable steps + the wallet context.
 */
export interface ClaimHookResult {
  /** Carried chain kind — never sniffed downstream (drives the address compare). */
  chainKind: ChainKind
  /**
   * Connect (AppKit / Solana connect modal) + chain-switch, returning the wallet
   * that actually connected. Reproduces the source flow's preflight exactly.
   */
  preflight: () => Promise<{ address: string | undefined }>
  /**
   * Runs the chain's claim sequence (byte/order-faithful to the source flow) and
   * returns the landed tx hash/signature. Throws on any unresolved precondition.
   */
  runClaim: () => Promise<string>
  /** Currently-connected wallet (for the modal's address-match guard). */
  connectedAddress: string | undefined
}

export interface PreparedPortalClaim {
  readonly allocation: bigint
  readonly released: bigint
  readonly consumed: bigint
  readonly claimable: bigint
  readonly walletAmount: bigint
  readonly lockedAmount: bigint
  readonly forfeitedAmount: bigint
  /** On-chain penalty windows, in Unix seconds. */
  readonly penaltyWindows: readonly { readonly beginTime: bigint; readonly endTime: bigint }[]
  /** Submit the reviewed claim once and return the confirmed transaction hash/signature. */
  submit(): Promise<string>
}

export interface DistributorClaimPortalResult extends ClaimHookResult {
  /** Get a quote and prepare the transaction without asking the wallet to submit it. */
  prepareClaim(): Promise<PreparedPortalClaim>
}
