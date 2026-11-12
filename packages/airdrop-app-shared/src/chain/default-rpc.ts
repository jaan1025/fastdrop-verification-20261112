import { clusterFromChainId, retargetSolanaClusterRpc } from "@repo/chain-solana-kit/config"
import { runtimeEnv } from "../env/runtime"

/**
 * The one-click "Use default" RPC offered for a Solana network in the create
 * wizard and project settings, derived from the env-configured endpoint via
 * {@link retargetSolanaClusterRpc} (chain-solana-kit) so the provider key never
 * leaves env. The field stays user-editable. Returns `undefined` for non-Solana
 * chains or an unset env endpoint.
 */
export function getDefaultSolanaRpcUrl(chainId: string | undefined): string | undefined {
  const cluster = clusterFromChainId(chainId)
  if (!cluster) return undefined
  const base = runtimeEnv.solanaRpcUrl
  if (!base) return undefined
  return retargetSolanaClusterRpc(base, cluster)
}
