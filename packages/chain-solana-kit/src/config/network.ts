import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { SOLANA_NETWORKS, type SolanaChain, type SolanaCluster } from "./registry"

export type { SolanaChain, SolanaCluster }

const toWsEndpoint = (httpEndpoint: string): string | undefined => {
  if (httpEndpoint.startsWith("https://")) return httpEndpoint.replace("https://", "wss://")
  if (httpEndpoint.startsWith("http://")) return httpEndpoint.replace("http://", "ws://")
  return undefined
}

export interface ResolveEndpointsOptions {
  /** The deployment's own RPC endpoint (`app_conf.rpcUrl`), injected at the root. */
  rpcUrl?: string
  wsUrl?: string
}

/** The internal `solana:<cluster>` tag for a cluster (from the registry). */
export const resolveChain = (cluster: SolanaCluster): SolanaChain => SOLANA_NETWORKS[cluster].chain

/**
 * Resolve RPC + (optional) WS endpoints for a cluster. There is NO public
 * fallback endpoint table anymore (the leaked Helius key is gone, analysis H1):
 * `rpcUrl` MUST be supplied (injected from the deployment's `app_conf.rpcUrl` or
 * the app env at the composition root). The WS endpoint is derived from the HTTP
 * one unless overridden.
 */
export const resolveEndpoints = (
  _cluster: SolanaCluster,
  options: ResolveEndpointsOptions,
): { rpcEndpoint: string; wsEndpoint: string | undefined } => {
  const rpcEndpoint = options.rpcUrl ?? ""
  const wsEndpoint = options.wsUrl ?? toWsEndpoint(rpcEndpoint)
  return { rpcEndpoint, wsEndpoint }
}

// Helius (and most managed Solana RPCs) front each cluster on its own subdomain.
// A project's env endpoint is configured for one cluster (typically mainnet), so
// retargeting its cluster subdomain lets a devnet/testnet project reuse the SAME
// provider key against the right cluster — the key rides along in the URL, never
// rehardcoded per cluster.
const CLUSTER_SUBDOMAIN: Record<SolanaCluster, string | undefined> = {
  "mainnet-beta": "mainnet",
  devnet: "devnet",
  testnet: "testnet",
  localnet: undefined,
}

const CLUSTER_LABEL = /^(mainnet(-beta)?|devnet|testnet)\./

/**
 * Retarget a managed-RPC URL to a given Solana cluster by swapping its leading
 * cluster subdomain (`mainnet.` -> `devnet.`), preserving scheme, path and any
 * `?api-key=...`. Returns `undefined` for localnet, a malformed URL, or a host
 * with no cluster subdomain to retarget — except mainnet-beta, where the URL is
 * already correct and reused verbatim. Env-free so it unit-tests without mocks.
 */
export const retargetSolanaClusterRpc = (
  baseUrl: string,
  cluster: SolanaCluster,
): string | undefined => {
  const subdomain = CLUSTER_SUBDOMAIN[cluster]
  if (!subdomain) return undefined

  let url: URL
  try {
    url = new URL(baseUrl)
  } catch {
    return undefined
  }

  if (CLUSTER_LABEL.test(url.hostname)) {
    url.hostname = url.hostname.replace(CLUSTER_LABEL, `${subdomain}.`)
    return url.toString()
  }
  // No cluster subdomain to retarget: only safe to reuse the endpoint verbatim
  // for mainnet; pointing devnet/testnet at it would query the wrong cluster.
  return cluster === "mainnet-beta" ? baseUrl : undefined
}

/**
 * Maps an ACS `app_conf.deployments[*].chainId` string (`"sol:mainnet"`,
 * `"sol:devnet"`, …) to a `SolanaCluster`. Returns `undefined` for non-Solana
 * chain ids so callers can no-op.
 *
 * Intentionally a lenient parser: ACS app_conf only ever emits the `sol:<cluster>`
 * grammar, but this ALSO tolerates the standard `solana:` tag, `mainnet-beta`,
 * `testnet`/`localnet`/`localhost`, and bare `sol`/`solana` (defensive — broader
 * than both the ACS grammar and the mainnet/devnet `SUPPORTED_SOLANA_CHAINS`
 * table). Note: the strict ACS classifier `isSolanaChainId` (`sol:` only) gates
 * upstream, so the non-`sol:` forms accepted here are belt-and-suspenders, not
 * reachable from a real app_conf chainId.
 */
export const clusterFromChainId = (chainId: string | undefined): SolanaCluster | undefined => {
  // Lenient on purpose, and DISTINCT from the strict ACS classifier
  // `isSolanaChainId` (`sol:` grammar only): this bridges the ACS `sol:` grammar
  // AND the standard `solana:` tag (+ bare `sol`/`solana`), so it keeps its own
  // prefix gate rather than inheriting the strict ACS classification.
  if (!chainId) return undefined
  const lower = chainId.toLowerCase()
  if (!lower.startsWith("sol")) return undefined
  // Accept `sol:` and `solana:` prefixes, plus bare `solana` / `sol`.
  const suffix = lower.replace(/^sol(ana)?:?/, "")
  if (suffix === "" || suffix === "mainnet" || suffix === "mainnet-beta") {
    return "mainnet-beta"
  }
  if (suffix === "devnet") return "devnet"
  if (suffix === "testnet") return "testnet"
  if (suffix === "localnet" || suffix === "localhost") return "localnet"
  return undefined
}

/**
 * Boundary adapter: translate an ACS `app_conf` chainId (`sol:<cluster>`) into the
 * STANDARD `SolanaChain` (`solana:<cluster>`) the generic client registry is keyed
 * by. `undefined` for non-Solana / unrecognized ids. This is the ONE place the
 * ACS-private grammar is converted to the standard tag — callers that hold an ACS
 * chainId convert here before touching `useSolanaClients` / `useSolanaReadClients`.
 */
export const solanaChainFromChainId = (chainId: string | undefined): SolanaChain | undefined => {
  const cluster = clusterFromChainId(chainId)
  return cluster ? resolveChain(cluster) : undefined
}

export interface SolanaReadContext {
  rpc: Rpc<SolanaRpcApi>
  chain: SolanaChain
}

/**
 * Build a read-only RPC + chain tag from a deployment's OWN `chainId` — the
 * authoritative source — independent of any ambient wallet/provider cluster.
 *
 * The Solana counterpart to how the EVM diff builds its public client from
 * `chainId`: an on-chain read should be a function of the data it reads about,
 * not of whatever cluster the wallet provider currently happens to be on.
 * Returns `undefined` for non-Solana chain ids so callers can no-op.
 *
 * `options.rpcUrl` is the deployment's own endpoint (`app_conf.rpcUrl`), INJECTED
 * by the caller — there is no embedded default endpoint anymore (analysis H1).
 */
export const resolveSolanaReadContext = (
  chainId: string | undefined,
  options: ResolveEndpointsOptions = {},
): SolanaReadContext | undefined => {
  const cluster = clusterFromChainId(chainId)
  if (!cluster) return undefined
  const { rpcEndpoint } = resolveEndpoints(cluster, options)
  if (!rpcEndpoint) return undefined
  return { rpc: createSolanaRpc(rpcEndpoint), chain: resolveChain(cluster) }
}
