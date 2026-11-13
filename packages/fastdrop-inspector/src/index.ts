import { resolveChainKind } from "../../acs-client/src/model/chain"
import { evmRpcUrl, getViemChain } from "../../chain-evm-kit/src/config/registry"
import { clusterFromChainId, retargetSolanaClusterRpc } from "../../chain-solana-kit/src/config/network"
import { inspectEvm } from "../../airdrop-evm/src/fastdrop/inspect-evm"
import { inspectSolana } from "../../airdrop-solana/src/fastdrop/inspect-solana"
import type { ChainInspector } from "./types"
export type { ChainInspector, ChainInspection, InspectionProviders, ChainConfiguration } from "./types"

export const inspectChain: ChainInspector = async (input, providers, options) => {
  const signal = options?.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(45_000)])
    : AbortSignal.timeout(45_000)
  const kind = resolveChainKind(input.chainId)
  const unsupported = () =>
    Object.assign(new Error("The ACS deployment network is not supported."), { code: "chain_unsupported" })
  const roles: Record<string, string> = {}
  for (const [key, value] of Object.entries(input.roles)) if (typeof value === "string") roles[key] = value
  const root = input.root as `0x${string}` | undefined
  if (kind === "evm") {
    if (!getViemChain(input.chainId)) throw unsupported()
    return inspectEvm({
      ...input,
      roles,
      root,
      signal,
      rpcUrl: providers.rpcUrl ?? evmRpcUrl(input.chainId, providers.alchemyApiKey)!,
    })
  }
  if (kind === "solana") {
    const cluster = clusterFromChainId(input.chainId)
    if (!cluster) throw unsupported()
    // An endpoint without a cluster label is used as supplied and checked against
    // the target genesis hash by the reader, never silently replaced by a public RPC.
    const rpcUrl =
      providers.rpcUrl ??
      (providers.solanaRpcUrl
        ? (retargetSolanaClusterRpc(providers.solanaRpcUrl, cluster) ?? providers.solanaRpcUrl)
        : undefined)
    return inspectSolana({ ...input, roles, root, rpcUrl, signal })
  }
  throw unsupported()
}
