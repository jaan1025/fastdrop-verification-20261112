import type { SupportedChain } from "@repo/acs-client/model"
import { buildAlchemyRpcUrl } from "./env"
import { CHAIN_SPECS } from "./registry"
export { getViemChain } from "./registry"

const specToSupported = (spec: typeof CHAIN_SPECS[number]): SupportedChain => {
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

export const getSupportedEvmChain = (chainId: number | string): SupportedChain | undefined =>
  SUPPORTED_EVM_CHAINS.find((c) => c.chainId === String(chainId))
