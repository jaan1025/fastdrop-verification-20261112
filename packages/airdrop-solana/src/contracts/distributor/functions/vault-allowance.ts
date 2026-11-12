import { type Address } from "@solana/kit"
import { type Token as LegacyToken } from "@solana-program/token"
import { type Token as LatestToken } from "@solana-program/token-2022"
import { readSplDelegate } from "@repo/chain-solana-kit/token"

/**
 * Resolve the SPL allowance the vault has delegated to the distributor: the
 * delegated amount when the token account's delegate IS the distributor, else
 * `0n`. On Solana, funding is pull-based — the vault owner `approve`s the
 * distributor as the SPL delegate, so a delegate that doesn't match the
 * distributor (or an absent / unfetched account) means there is no live
 * allowance. Pure decode, no RPC; the `Option<Address>` delegate is unwrapped by
 * the kit's `readSplDelegate`.
 *
 * Sunk from the console `use-funding-overview-solana` leaf (S5). `tokenAccount`
 * accepts either token-program version — both carry `delegate` /
 * `delegatedAmount`, matching the kit's `useTokenAccount` return.
 */
export function resolveDistributorAllowance(params: {
  tokenAccount: LegacyToken | LatestToken | null | undefined
  distributor: Address | undefined
}): bigint {
  const { tokenAccount, distributor } = params
  const delegated = readSplDelegate(tokenAccount)
  if (delegated && delegated.delegate === distributor) {
    return delegated.delegatedAmount
  }
  return 0n
}
