import { match } from "@repo/shared/utils"
import { type ChainKind } from "./chain"

/**
 * True when `connected` is the same wallet as the allocation `handler`. `kind` is
 * carried as `ChainKind` (never an ad-hoc string — the single classification
 * point) and dispatched via `match`: EVM is compared case-insensitively
 * (handlers are lowercased for ACS exact-match; wallets may be checksummed);
 * Solana base58 is compared exactly — never lowercased. A missing
 * connected/handler address is never a match (the guard stays closed until a
 * wallet is connected).
 */
export function addressesMatch(
  kind: ChainKind,
  connected: string | undefined,
  handler: string | undefined,
): boolean {
  if (!connected || !handler) return false
  return match(kind, {
    evm: () => connected.toLowerCase() === handler.toLowerCase(),
    solana: () => connected === handler,
  })
}
