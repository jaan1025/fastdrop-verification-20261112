import type { SupportedChain } from "@repo/acs-client/model"

/**
 * The ONE canonical Solana chain/cluster registry (analysis M5). Owns every
 * network fact: the `sol:<cluster>` chainId tag app_conf writes, the
 * `solana:<cluster>` SolanaChain tag used internally, the display name, native
 * symbol, and the explorer cluster query value. It holds NO embedded RPC
 * endpoint — the RPC/WS URL is injected at the composition root via
 * `SolanaProviderConfig` / `resolveSolanaReadContext` (analysis H1; the leaked
 * Helius key is deleted + rotated). `network.ts`, the explorer hook, and the
 * `SUPPORTED_SOLANA_CHAINS` table all read from this one source.
 */

export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet" | "localnet"

/** Internal chain tag (`solana:<cluster>`), distinct from the `sol:` app_conf grammar. */
export type SolanaChain = `solana:${string}`

export interface SolanaNetwork {
  /** Cluster identity. */
  cluster: SolanaCluster
  /** Canonical `sol:<cluster>` chainId tag written to app_conf. */
  chainId: string
  /** Internal `solana:<cluster>` SolanaChain tag. */
  chain: SolanaChain
  /** Human-facing name. */
  displayName: string
  /** Native currency symbol. */
  nativeCurrencySymbol: string
  /**
   * Explorer cluster query value (`?cluster=<x>`); `undefined` for mainnet
   * (the explorer default, no query needed).
   */
  explorerCluster: "devnet" | "testnet" | "custom" | undefined
}

/** The registry, keyed by cluster — the single source of every network fact. */
export const SOLANA_NETWORKS: Record<SolanaCluster, SolanaNetwork> = {
  "mainnet-beta": {
    cluster: "mainnet-beta",
    chainId: "sol:mainnet",
    chain: "solana:mainnet",
    displayName: "Solana Mainnet",
    nativeCurrencySymbol: "SOL",
    explorerCluster: undefined,
  },
  devnet: {
    cluster: "devnet",
    chainId: "sol:devnet",
    chain: "solana:devnet",
    displayName: "Solana Devnet",
    nativeCurrencySymbol: "SOL",
    explorerCluster: "devnet",
  },
  testnet: {
    cluster: "testnet",
    chainId: "sol:testnet",
    chain: "solana:testnet",
    displayName: "Solana Testnet",
    nativeCurrencySymbol: "SOL",
    explorerCluster: "testnet",
  },
  localnet: {
    cluster: "localnet",
    chainId: "sol:localnet",
    chain: "solana:localnet",
    displayName: "Solana Localnet",
    nativeCurrencySymbol: "SOL",
    explorerCluster: "custom",
  },
}

/**
 * The `sol:<cluster>` chains app_conf actually writes (mainnet + devnet). Kept
 * as a `SupportedChain[]` for the chain-picker, but with NO embedded `rpcUrl` —
 * the endpoint is injected per deployment (`app_conf.rpcUrl`) at the root.
 */
export const SUPPORTED_SOLANA_CHAINS: readonly SupportedChain[] = [
  {
    chainId: SOLANA_NETWORKS["mainnet-beta"].chainId,
    displayName: SOLANA_NETWORKS["mainnet-beta"].displayName,
    rpcUrl: "",
    nativeCurrencySymbol: SOLANA_NETWORKS["mainnet-beta"].nativeCurrencySymbol,
    category: "solana",
  },
  {
    chainId: SOLANA_NETWORKS.devnet.chainId,
    displayName: SOLANA_NETWORKS.devnet.displayName,
    rpcUrl: "",
    nativeCurrencySymbol: SOLANA_NETWORKS.devnet.nativeCurrencySymbol,
    category: "solana",
  },
]

export const getSupportedSolanaChain = (chainId: string): SupportedChain | undefined =>
  SUPPORTED_SOLANA_CHAINS.find((c) => c.chainId === chainId)
