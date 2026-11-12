import { clusterFromChainId, solanaChainFromChainId } from "@repo/chain-solana-kit/config"
import type { SolanaClientEntry, SolanaProviderConfig } from "@repo/chain-solana-kit/react"
import type { AppConf } from "@repo/acs-client/model"
import { runtimeEnv } from "../../env"

/**
 * Single source for the Solana rpcUrl-fallback POLICY: the deployment's OWN
 * `app_conf.rpcUrl` wins; a mainnet deployment with no URL falls back to the app
 * env endpoint; devnet/testnet with no URL stays `undefined`. There is NO
 * embedded fallback endpoint (the leaked Helius key is gone, analysis H1).
 *
 * Consumed by {@link deploymentsToSolanaEntries} to seed the global Solana client
 * registry (the chainId→{rpc,ws,chain} map) — the one place RPC endpoints are
 * resolved, mirroring EVM's wagmi transport map.
 */
export function deploymentToSolanaConfig(
  deployment: { chainId?: string; rpcUrl?: string } | undefined,
): SolanaProviderConfig {
  const cluster = clusterFromChainId(deployment?.chainId) ?? "mainnet-beta"
  const projectRpcUrl = deployment?.rpcUrl?.trim() || undefined
  // Paid endpoint is for mainnet load only; devnet/testnet always go via the
  // project's own URL (public RPC otherwise).
  const isMainnet = cluster === "mainnet-beta"
  return {
    network: cluster,
    rpcUrl: projectRpcUrl ?? (isMainnet ? runtimeEnv.solanaRpcUrl : undefined),
    wsUrl: !projectRpcUrl && isMainnet ? runtimeEnv.solanaWsUrl : undefined,
  }
}

/**
 * Seed the global Solana client registry (`SolanaClientsProvider`) from appConf:
 * one `SolanaClientEntry` per Solana deployment, keyed by its `chainId`, with the
 * endpoint resolved via the same {@link deploymentToSolanaConfig} fallback policy.
 *
 * The mainnet env entry is seeded FIRST so a mainnet deployment's own URL (pushed
 * later) wins per chainId (last-non-empty-wins collapse in `buildSolanaClientsMap`).
 * Entries with no resolvable endpoint (e.g. a devnet deployment with no rpcUrl —
 * H1 leaves no default) are dropped; their reads gate on a resolved client.
 * Non-Solana deployments are skipped. `appConf === undefined` (pre-auth) yields
 * just the mainnet env seed.
 */
export function deploymentsToSolanaEntries(appConf: AppConf | undefined): SolanaClientEntry[] {
  const entries: SolanaClientEntry[] = []
  if (runtimeEnv.solanaRpcUrl) {
    entries.push({
      chain: "solana:mainnet",
      rpcUrl: runtimeEnv.solanaRpcUrl,
      wsUrl: runtimeEnv.solanaWsUrl,
    })
  }
  for (const deployment of Object.values(appConf?.deployments ?? {})) {
    const chain = solanaChainFromChainId(deployment.chainId)
    if (!chain) continue
    const { rpcUrl, wsUrl } = deploymentToSolanaConfig(deployment)
    if (rpcUrl) entries.push({ chain, rpcUrl, wsUrl })
  }
  return entries
}
