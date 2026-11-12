import { resolveChainKind } from "@repo/acs-client/model"
import { match } from "@repo/shared/utils"
import { getViemChain } from "@repo/chain-evm-kit/config"
import { getTransactionExplorerLink as evmExplorerLink } from "@repo/chain-evm-kit/transaction"
import { solanaChainFromChainId } from "@repo/chain-solana-kit/config"
import { getTransactionExplorerLink as solanaExplorerLink } from "@repo/chain-solana-kit/transaction"

/**
 * Pure-function chain-dispatch facade for block-explorer tx links. Classifies the
 * ACS `chainId` ONCE via `resolveChainKind` (the single classification point —
 * never sniff the chainId ad-hoc), then delegates to each chain kit's PURE url
 * builder:
 *   - EVM   → resolve the viem `Chain` from the catalog (`getViemChain`) and hand
 *             it to the EVM builder, which carries the explorer host.
 *   - Solana → resolve the `SolanaChain` (`solana:<cluster>`) from the chainId and
 *             pass it through so the cluster query matches the existing hook output
 *             (mainnet → no `?cluster=`, devnet → `?cluster=devnet`).
 *
 * Returns the empty string for an unclassifiable chainId, a missing catalog chain,
 * or a missing explorer — never throws. Consumers treat the empty string as
 * "no link". The dual chain-kit imports are pure functions + catalogs (no SDK
 * hooks); the both-chain boundary is sanctioned by a rule-2 entry in
 * `scripts/chain-boundary-exceptions.json`.
 */
export const getTransactionExplorerLink = (chainId: string, txHash: string): string => {
  const kind = resolveChainKind(chainId)
  if (!kind) return ""

  return match(kind, {
    evm: (): string => {
      const chain = getViemChain(chainId)
      return chain ? evmExplorerLink(txHash, chain) : ""
    },
    solana: (): string => {
      const chain = solanaChainFromChainId(chainId)
      return chain ? solanaExplorerLink(txHash, { chain }) : ""
    },
  })
}
