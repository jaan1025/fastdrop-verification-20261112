import type { SupportedChain } from "@repo/acs-client/model"
import { SUPPORTED_EVM_CHAINS } from "@repo/chain-evm-kit/config"
import { SUPPORTED_SOLANA_CHAINS } from "@repo/chain-solana-kit/config"

/**
 * Every chain the console can render or pick — the union of each chain package's
 * own catalog. The single source of truth for chain display; nothing maintains a
 * parallel chainId→name table.
 */
export const ALL_KNOWN_CHAINS: readonly SupportedChain[] = [
  ...SUPPORTED_EVM_CHAINS,
  ...SUPPORTED_SOLANA_CHAINS,
]

export const getSupportedChain = (chainId: string | undefined): SupportedChain | undefined =>
  chainId ? ALL_KNOWN_CHAINS.find((c) => c.chainId === chainId) : undefined

/**
 * Human-readable chain name for a raw ACS chainId, sourced from each chain
 * package's own catalog (not a hand-maintained table). Falls back to the raw id
 * when the chain isn't in any catalog, and "Unknown" when there's no id.
 */
export const chainDisplayName = (chainId: string | undefined): string => {
  if (!chainId) return "Unknown"
  return getSupportedChain(chainId)?.displayName ?? chainId
}
