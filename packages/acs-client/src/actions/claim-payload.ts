// Shared claim-payload base types (M5 fix): one core type the overlapping
// `getClaimData` / `paymasterClaim` param bags extend, so the EVM-relay-only
// constraint is visible at the type level instead of in prose. Pure types.
import type { WalletSet } from "../model"

/** Fields common to every claim request. */
export interface ClaimDataBase {
  /** Batch id. */
  batch: string
  /** Strategy-encoded extra bytes (chain-specific encoding; built by chain SDKs). */
  extra: string
  /** Overrides the client's deploymentId for this call. */
  deploymentId?: string
}

/** Input to the co-sign read `POST /claim`. */
export interface GetClaimDataParams extends ClaimDataBase {
  /** Allocation key; EVM-normalized only in static mode. */
  addressHandler: string
  /** Client-side serialization only. Preserve the exact ACS allocation key. */
  dynamicRecipient?: boolean
  /** User ToS signature. */
  sig: string
  /** Wallet set context. */
  walletSet?: WalletSet
  /** Whether the claim is being deferred. */
  isDeferring?: boolean
}

/** ToS authenticated quote: omitting extra selects release-only mode. */
export type QuoteClaimDataParams = Pick<
  GetClaimDataParams,
  "batch" | "deploymentId" | "addressHandler" | "sig" | "walletSet" | "dynamicRecipient"
>

/**
 * Input to the EVM-only relayed claim `POST /relay/claim`. The EVM-only-ness is
 * structural: `onBehalfOf` (an EVM concept, no Solana analogue) is required here
 * only.
 */
export interface PaymasterClaimParams extends ClaimDataBase {
  /** Merkle proof. */
  proof: string[]
  /** Claim co-signature. */
  signature: string
  /** Claim amount. */
  amount: string
  /** Already-released amount. */
  released: string
  /** Beneficiary address (EVM `onBehalfOf` semantics). */
  onBehalfOf: string
  /** Handler/strategy. */
  handler: string
  /** Authority address. */
  authority?: string
}
