import { type Address } from "@solana/kit"
import { type Token as LegacyToken } from "@solana-program/token"
import { type Token as LatestToken } from "@solana-program/token-2022"

/** A decoded SPL or Token-2022 token account. */
export type TokenAccount = LegacyToken | LatestToken

/**
 * Read the SPL delegate off a decoded token account: the `{ delegate,
 * delegatedAmount }` pair when a delegate is set (the account's `delegate`
 * `Option` is `Some`), or `null` when no delegate is set or the account is
 * absent / unfetched. A delegate with a zero `delegatedAmount` still counts as
 * set (returns the pair with `0n`).
 *
 * The ONE place the token account's `Option<Address>` delegate field is
 * unwrapped — both token-program versions carry the same `delegate` /
 * `delegatedAmount` shape. Pure decode, no RPC.
 */
export const readSplDelegate = (
  tokenAccount: TokenAccount | null | undefined,
): { delegate: Address; delegatedAmount: bigint } | null => {
  if (!tokenAccount) return null
  const { delegate } = tokenAccount
  if (delegate.__option !== "Some") return null
  return { delegate: delegate.value, delegatedAmount: tokenAccount.delegatedAmount }
}
