// chains sub-barrel — the one chain/cluster registry + network resolvers. The
// endpoint is injected (no embedded RPC URL, analysis M5/H1).

// `@solana/kit` Address passthrough — the generic base58 address brand + the
// strict base58 predicate (full decode, not a regex), so chain-free consumers
// get the type and validator without importing `@solana/*` directly.
export type { Address, Commitment, Rpc, SolanaRpcApi } from "@solana/kit"
export {
  isAddress as isSolanaAddressStrict,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit"
export {
  SOLANA_NETWORKS,
  SUPPORTED_SOLANA_CHAINS,
  getSupportedSolanaChain,
  type SolanaNetwork,
  type SolanaChain,
  type SolanaCluster,
} from "./registry"
export {
  resolveChain,
  resolveEndpoints,
  retargetSolanaClusterRpc,
  clusterFromChainId,
  solanaChainFromChainId,
  resolveSolanaReadContext,
  type ResolveEndpointsOptions,
  type SolanaReadContext,
} from "./network"
