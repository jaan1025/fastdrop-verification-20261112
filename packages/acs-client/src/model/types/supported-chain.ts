/**
 * Cross-chain shape for the network picker. The canonical `chainId` string
 * convention comes from ACS — every `app_conf.deployments[*].chainId` value
 * follows this format:
 *   - EVM: numeric chain id serialized as a string (`"1"`, `"137"`, `"11155111"`).
 *   - Solana: `sol:<cluster>` (`"sol:mainnet"`, `"sol:devnet"`).
 *
 * Both `@repo/chain-evm-kit` and `@repo/chain-solana-kit` ship lists matching this
 * shape so a single UI component can render a unified dropdown.
 */
export interface SupportedChain {
  chainId: string
  displayName: string
  /** RPC URL written to `app_conf.deployments[*].rpcUrl` when this chain is picked. */
  rpcUrl: string
  nativeCurrencySymbol: string
  category: "mainnet" | "testnet" | "solana"
}
