/**
 * ACS chainId format — identity predicates + kind resolution.
 *
 * Every `app_conf.deployments[*].chainId` follows ACS's own string convention:
 *   - EVM: the EIP-155 chain id serialized as a string (`"1"`, `"8453"`).
 *   - Solana: `sol:<cluster>` (`"sol:mainnet"`, `"sol:devnet"`).
 *
 * This is **the single classification point** for the whole monorepo. Every
 * chain decision originates here — callers must NOT sniff chainId/address
 * ad-hoc (L4). The resolved kind dispatches via `@repo/shared/utils` `match`,
 * or hands off to each chain package for its own descriptor.
 */

/**
 * The chain families the system dispatches over. The canonical `ChainKind` for
 * the whole monorepo (re-exported by `airdrop-base`/chain SDKs, never redefined).
 */
export type ChainKind = "evm" | "solana"

/** True when chainId (case-insensitive) matches the `sol:<cluster>` grammar. */
export const isSolanaChainId = (chainId: string | undefined): chainId is string =>
  chainId?.toLowerCase().startsWith("sol:") ?? false

/**
 * True when chainId is present, not Solana, and a strict decimal integer
 * (the EIP-155 serialization). Excludes hex / exponent / binary / signed /
 * whitespace forms that `Number()` would otherwise coerce.
 */
export const isEvmChainId = (chainId: string | undefined): chainId is string => {
  if (!chainId) return false
  if (isSolanaChainId(chainId)) return false
  return /^\d+$/.test(chainId)
}

/**
 * Resolve a raw ACS chainId to its chain kind, or `undefined` when the id is
 * missing or unrecognised. The single place a raw chainId is classified — add a
 * new arm here when a new chain kind is supported.
 */
export function resolveChainKind(chainId: string | undefined): ChainKind | undefined {
  if (isSolanaChainId(chainId)) return "solana"
  if (isEvmChainId(chainId)) return "evm"
  return undefined
}
