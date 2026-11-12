import {
  clusterFromChainId,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  resolveEndpoints,
  type SolanaChain,
} from "@repo/chain-solana-kit/config"
import { useSolanaReadClients, type SolanaReadClients } from "@repo/chain-solana-kit/react"

/**
 * Solana leaf of the chain-read-client family: builds a form-scoped rpc/ws from
 * the chosen cluster + rpcUrl so deploy-tx finality polls the cluster the user
 * actually picked, and ALSO exposes the global-registry rpc/ws for the resume
 * path. Isolates the `@solana/*` imports.
 */

/**
 * The Solana rpc + subscriptions pair the tx-finality facade consumes: the kit's
 * `ws` renamed to `rpcSubscriptions` (to match `ConfirmTxParams` /
 * `solanaConfirm`) and `chain` dropped. Local to the chain-read-client family —
 * its field types track the kit's `SolanaReadClients`; NOT a shared cross-package
 * alias.
 */
export type SolanaConfirmClients = {
  rpc: SolanaReadClients["rpc"]
  rpcSubscriptions: SolanaReadClients["ws"]
}

/**
 * Form-scoped path: returns `{ rpc, rpcSubscriptions }` for the resolved cluster;
 * `rpcSubscriptions` is `undefined` when no ws endpoint can be derived (confirm
 * falls back to rpc polling). Still builds directly from form values — the chosen
 * rpcUrl isn't in appConf yet. Throws on an unrecognized Solana chainId rather
 * than silently targeting mainnet-beta, so a malformed `sol:` id surfaces loudly
 * instead of mis-polling the wrong cluster.
 */
export function resolveChainClientsSolana(input: {
  chainId: string
  rpcUrl: string
}): SolanaConfirmClients {
  const cluster = clusterFromChainId(input.chainId)
  if (!cluster) {
    throw new Error(`Unrecognized Solana chainId: ${input.chainId}`)
  }
  const { rpcEndpoint, wsEndpoint } = resolveEndpoints(cluster, {
    rpcUrl: input.rpcUrl.trim(),
  })
  return {
    rpc: createSolanaRpc(rpcEndpoint),
    rpcSubscriptions: wsEndpoint ? createSolanaRpcSubscriptions(wsEndpoint) : undefined,
  }
}

/**
 * Resume/context path: resolves `{ rpc, rpcSubscriptions }` for the deploy's
 * chain from the global client registry (used to await Solana deploy-tx finality
 * on an existing project, whose endpoint is in appConf).
 */
export function useChainClientsSolana(chain: SolanaChain | undefined): SolanaConfirmClients {
  const { rpc, ws } = useSolanaReadClients(chain)
  return { rpc, rpcSubscriptions: ws }
}
