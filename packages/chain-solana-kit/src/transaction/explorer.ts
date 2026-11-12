import { SOLANA_NETWORKS, type SolanaChain, type SolanaCluster } from "../config/registry"

/** Detection inputs for an explorer link: an explicit `cluster`, or a `chain` +
 * `endpoint` pair to infer it from. */
export interface SolanaExplorerOptions {
  cluster?: string
  chain?: SolanaChain
  endpoint?: string
}

/**
 * Resolve the cluster for an explorer link. Prefers an explicit `cluster` (when
 * it is a known registry key), otherwise infers from `chain` / `endpoint`
 * substrings, defaulting to `mainnet-beta`. The cluster grammar lives in the ONE
 * chain registry (`SOLANA_NETWORKS`, analysis M5) and is not re-parsed elsewhere.
 */
const resolveCluster = ({ cluster, chain, endpoint }: SolanaExplorerOptions): SolanaCluster => {
  if (cluster && cluster in SOLANA_NETWORKS) {
    return cluster as SolanaCluster
  }
  if (chain?.includes("devnet") || endpoint?.includes("devnet")) {
    return "devnet"
  }
  if (chain?.includes("testnet") || endpoint?.includes("testnet")) {
    return "testnet"
  }
  if (endpoint?.includes("localhost") || endpoint?.includes("127.0.0.1")) {
    return "localnet"
  }
  return "mainnet-beta"
}

/**
 * Pure block-explorer tx-link builder; the Solana counterpart to the EVM
 * `getTransactionExplorerLink`. Returns the empty string for an empty signature.
 * Mainnet is the explorer default (no query); non-mainnet clusters append the
 * cluster name as the `?cluster=` value.
 */
export const getTransactionExplorerLink = (
  txSignature: string,
  options: SolanaExplorerOptions,
): string => {
  if (!txSignature) return ""
  const cluster = resolveCluster(options)
  const clusterParam = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`
  return `https://explorer.solana.com/tx/${txSignature}${clusterParam}`
}

/**
 * Pure block-explorer ADDRESS-link builder (the account page, not a tx). Shares
 * the one cluster resolver with the tx builder. Returns the empty string for an
 * empty address.
 */
export const getAddressExplorerLink = (address: string, options: SolanaExplorerOptions): string => {
  if (!address) return ""
  const cluster = resolveCluster(options)
  const clusterParam = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`
  return `https://explorer.solana.com/address/${address}${clusterParam}`
}
