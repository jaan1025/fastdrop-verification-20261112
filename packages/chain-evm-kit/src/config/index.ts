// Curated `/config` barrel: wallet-stack composition root + supported-chain
// registry. (`./env` stays internal. The CliqueLock address registry moved to
// `@repo/airdrop-evm/contracts` — it is Clique contract data, not config.)

export {
  initAppKit,
  ensureAppKit,
  getAppKit,
  getWagmiConfig,
  type AppKitInstance,
  type InitAppKitOptions,
} from "./wagmi-config"
export { SUPPORTED_EVM_CHAINS, getSupportedEvmChain, getViemChain } from "./supported-chains"
