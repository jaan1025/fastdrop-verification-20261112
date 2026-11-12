import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  base,
  baseSepolia,
  blast,
  bsc,
  celo,
  fantom,
  gnosis,
  linea,
  mainnet,
  mantle,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  scroll,
  sepolia,
  zksync,
} from "viem/chains"
import type { Chain } from "viem"
import type { SupportedChain } from "@repo/acs-client/model"
import { buildAlchemyRpcUrl } from "./env"

interface ChainSpec {
  chain: Chain
  category: "mainnet" | "testnet"
  /** Alchemy subdomain. If omitted, fall back to `chain.rpcUrls.default.http[0]`. */
  alchemySubdomain?: string
}

// Ordered by user-facing prominence within each category. Mirrors the legacy
// `supportedChainsAtom` list verbatim — keep in sync when adding chains.
const CHAIN_SPECS: ChainSpec[] = [
  { chain: mainnet, category: "mainnet", alchemySubdomain: "eth-mainnet" },
  { chain: polygon, category: "mainnet", alchemySubdomain: "polygon-mainnet" },
  { chain: arbitrum, category: "mainnet", alchemySubdomain: "arb-mainnet" },
  { chain: optimism, category: "mainnet", alchemySubdomain: "opt-mainnet" },
  { chain: base, category: "mainnet", alchemySubdomain: "base-mainnet" },
  { chain: bsc, category: "mainnet", alchemySubdomain: "bnb-mainnet" },
  { chain: avalanche, category: "mainnet", alchemySubdomain: "avax-mainnet" },
  { chain: gnosis, category: "mainnet" },
  { chain: fantom, category: "mainnet" },
  { chain: celo, category: "mainnet" },
  { chain: linea, category: "mainnet" },
  { chain: scroll, category: "mainnet" },
  { chain: zksync, category: "mainnet" },
  { chain: mantle, category: "mainnet" },
  { chain: blast, category: "mainnet" },
  { chain: sepolia, category: "testnet", alchemySubdomain: "eth-sepolia" },
  { chain: baseSepolia, category: "testnet", alchemySubdomain: "base-sepolia" },
  {
    chain: arbitrumSepolia,
    category: "testnet",
    alchemySubdomain: "arb-sepolia",
  },
  {
    chain: optimismSepolia,
    category: "testnet",
    alchemySubdomain: "opt-sepolia",
  },
  { chain: polygonAmoy, category: "testnet", alchemySubdomain: "polygon-amoy" },
]

const specToSupported = (spec: ChainSpec): SupportedChain => {
  const rpcUrl = spec.alchemySubdomain
    ? buildAlchemyRpcUrl(spec.alchemySubdomain)
    : (spec.chain.rpcUrls.default.http[0] ?? "")
  return {
    chainId: String(spec.chain.id),
    displayName: spec.chain.name,
    rpcUrl,
    nativeCurrencySymbol: spec.chain.nativeCurrency.symbol,
    category: spec.category,
  }
}

export const SUPPORTED_EVM_CHAINS: readonly SupportedChain[] = CHAIN_SPECS.map(specToSupported)

const VIEM_CHAINS_BY_ID: Record<string, Chain> = Object.fromEntries(
  CHAIN_SPECS.map((spec) => [String(spec.chain.id), spec.chain]),
)

export const getSupportedEvmChain = (chainId: number | string): SupportedChain | undefined =>
  SUPPORTED_EVM_CHAINS.find((c) => c.chainId === String(chainId))

/** Underlying viem `Chain` object for `wagmi` / `@reown/appkit` registration. */
export const getViemChain = (chainId: number | string): Chain | undefined =>
  VIEM_CHAINS_BY_ID[String(chainId)]
