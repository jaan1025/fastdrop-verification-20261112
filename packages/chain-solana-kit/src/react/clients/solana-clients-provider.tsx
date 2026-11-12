"use client"
import { createContext, useContext, useMemo, type ReactNode } from "react"
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
} from "@solana/kit"
import { type SolanaChain } from "../../config/network"
import { logger } from "../../utils/logger"

/**
 * The global Solana client registry — the Solana mirror of EVM's wagmi transport
 * map. Given a `SolanaChain` (the standard `solana:<cluster>` tag),
 * `useSolanaClients` returns its `{rpc, ws, chain}`, resolved ONCE in a single
 * place (seeded at the composition root), exactly as `usePublicClient({chainId})`
 * resolves an EVM client. This replaces the old ambient "rpc lives inside the
 * wallet provider, swapped by route/subtree" model: reads name their chain and
 * the registry answers — no per-subtree providers, no rpcUrl threaded as props.
 *
 * Keyed by the STANDARD `SolanaChain`, never the ACS-private `sol:<cluster>`
 * grammar — translating an ACS chainId into a `SolanaChain` is the caller's job
 * at the boundary (`solanaChainFromChainId`), keeping this generic package free
 * of ACS specifics. Endpoints stay per-deployment / user-entered (no embedded
 * defaults, analysis H1); deployments collapse per cluster when seeded.
 */

export interface SolanaClientEntry {
  /** The standard `solana:<cluster>` chain tag this endpoint serves. */
  chain: SolanaChain
  /** The cluster's RPC endpoint (the deployment's `app_conf.rpcUrl`, or env mainnet). */
  rpcUrl: string
  /** Optional WS endpoint; derived from `rpcUrl` when omitted. */
  wsUrl?: string
}

export interface SolanaClients {
  rpc: Rpc<SolanaRpcApi>
  ws?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  chain: SolanaChain
}

/**
 * What {@link useSolanaReadClients} returns: the registry `rpc`/`ws` for a
 * chain — each `undefined` until the composition root seeds that cluster — plus
 * the resolved `chain` tag. The read-side counterpart to {@link SolanaClients}
 * (a fully-resolved entry whose `rpc` is always present).
 */
export interface SolanaReadClients {
  rpc: Rpc<SolanaRpcApi> | undefined
  ws: RpcSubscriptions<SolanaRpcSubscriptionsApi> | undefined
  chain: SolanaChain
}

const deriveWsEndpoint = (rpcUrl: string, wsUrl?: string): string | undefined => {
  if (wsUrl) return wsUrl
  if (rpcUrl.startsWith("https://")) return rpcUrl.replace("https://", "wss://")
  if (rpcUrl.startsWith("http://")) return rpcUrl.replace("http://", "ws://")
  return undefined
}

const buildClients = (entry: SolanaClientEntry): SolanaClients | undefined => {
  if (!entry.rpcUrl) return undefined
  const wsEndpoint = deriveWsEndpoint(entry.rpcUrl, entry.wsUrl)
  let ws: RpcSubscriptions<SolanaRpcSubscriptionsApi> | undefined
  if (wsEndpoint?.startsWith("wss://") || wsEndpoint?.startsWith("ws://")) {
    try {
      ws = createSolanaRpcSubscriptions(wsEndpoint)
    } catch (e) {
      logger.error("Failed to create Solana RPC subscriptions", e)
    }
  }
  return { rpc: createSolanaRpc(entry.rpcUrl), ws, chain: entry.chain }
}

/**
 * PURE: build the `SolanaChain`→clients map from entries (last non-empty entry
 * wins per chain). Extracted so the resolution is unit-testable without React.
 */
export const buildSolanaClientsMap = (
  entries: readonly SolanaClientEntry[],
): Map<SolanaChain, SolanaClients> => {
  const map = new Map<SolanaChain, SolanaClients>()
  for (const entry of entries) {
    const clients = buildClients(entry)
    if (clients) map.set(entry.chain, clients)
  }
  return map
}

/**
 * PURE: a stable identity key for an entries list. Same content → same string,
 * so the provider's `useMemo` only rebuilds clients when an endpoint actually
 * changes — keeping rpc/ws references stable for react-query dedup.
 */
export const solanaEntriesKey = (entries: readonly SolanaClientEntry[]): string =>
  entries.map((e) => `${e.chain}|${e.rpcUrl}|${e.wsUrl ?? ""}`).join(",")

const SolanaClientsContext = createContext<Map<SolanaChain, SolanaClients>>(new Map())

export interface SolanaClientsProviderProps {
  entries: readonly SolanaClientEntry[]
  children: ReactNode
}

export const SolanaClientsProvider = ({ entries, children }: SolanaClientsProviderProps) => {
  const key = solanaEntriesKey(entries)
  const map = useMemo(
    () => buildSolanaClientsMap(entries),
    // Rebuild only when the endpoint set changes, not on every new array
    // identity — `key` is the content hash. (entries intentionally omitted.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )
  return <SolanaClientsContext.Provider value={map}>{children}</SolanaClientsContext.Provider>
}

/**
 * The Solana mirror of `usePublicClient({chainId})`: resolve `{rpc, ws, chain}`
 * for a `SolanaChain` from the global registry. Returns `undefined` for an
 * unknown or not-yet-seeded chain (reads gate on a resolved client via their
 * `ready`/skipToken guards — the async-appConf readiness contract).
 */
export const useSolanaClients = (chain: SolanaChain | undefined): SolanaClients | undefined => {
  const map = useContext(SolanaClientsContext)
  return chain ? map.get(chain) : undefined
}

/**
 * Read-side resolver: a drop-in for the old `const { rpc, chain } = useSolana()`.
 * `chain` is ALWAYS resolved (the passed `SolanaChain`, falling back to mainnet
 * when absent — harmless, the read self-skips on undefined params), while
 * `rpc`/`ws` come from the registry and are `undefined` until seeded. Reads gate
 * on `rpc` (skipToken).
 */
export const useSolanaReadClients = (chain: SolanaChain | undefined): SolanaReadClients => {
  const clients = useSolanaClients(chain)
  return {
    rpc: clients?.rpc,
    ws: clients?.ws,
    chain: chain ?? "solana:mainnet",
  }
}
