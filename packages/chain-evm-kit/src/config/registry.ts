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

interface ChainSpec {
  chain: Chain
  category: "mainnet" | "testnet"
  /** Alchemy subdomain. If omitted, fall back to `chain.rpcUrls.default.http[0]`. */
  alchemySubdomain?: string
}

// Ordered by user-facing prominence within each category. Mirrors the legacy
// `supportedChainsAtom` list verbatim — keep in sync when adding chains.
export const CHAIN_SPECS: ChainSpec[] = [
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

export const getViemChain = (chainId: number | string): Chain | undefined =>
  CHAIN_SPECS.find((spec) => String(spec.chain.id) === String(chainId))?.chain

export function evmRpcUrl(chainId: string, alchemyApiKey?: string): string | undefined {
  const spec = CHAIN_SPECS.find((entry) => String(entry.chain.id) === chainId)
  return spec?.alchemySubdomain && alchemyApiKey ? `https://${spec.alchemySubdomain}.g.alchemy.com/v2/${alchemyApiKey}` : spec?.chain.rpcUrls.default.http[0]
}
