import { resolveChainKind } from "@repo/acs-client/model"
import { match } from "@repo/shared/utils"
import { solanaChainFromChainId } from "@repo/chain-solana-kit/config"
import { type WaitForReceiptClient } from "@repo/chain-evm-kit/transaction"
import {
  resolveChainClientsSolana,
  useChainClientsSolana,
  type SolanaConfirmClients,
} from "./use-chain-clients-solana"
import { resolveChainClientEvm, useChainClientEvm } from "./use-chain-clients-evm"

/** Resolved per-chain read clients. */
export interface UseChainClientsResult {
  /** EVM public client pinned to the selected chain (EVM only). */
  publicClient: WaitForReceiptClient | undefined
  /** Solana rpc/ws pair (Solana only). */
  solana: SolanaConfirmClients | undefined
}

/**
 * Chain-dispatch facade: the ONE chain-read-client family, consumed by every
 * flow that awaits tx finality (create, resume, wizard, configuration-create,
 * batch-sync confirm). Classifies once via `resolveChainKind` and mounts both
 * leaves (Rules of Hooks), returning the active chain's clients with the inactive
 * arm `undefined`. When `rpcUrl` is supplied (the create/wizard form path), the
 * Solana clients are form-scoped to the chosen cluster; otherwise the captured
 * `useSolana` context is used. Carries no `wagmi`/`@solana/*` imports — those
 * live in the leaves.
 */
export function useChainClients(params: {
  chainId: string | undefined
  rpcUrl?: string
}): UseChainClientsResult {
  const kind = resolveChainKind(params.chainId)
  const evmChainId = kind === "evm" && params.chainId ? Number(params.chainId) : undefined

  const publicClient = useChainClientEvm({ evmChainId })
  const contextSolana = useChainClientsSolana(solanaChainFromChainId(params.chainId))

  return match<NonNullable<typeof kind> | "none", UseChainClientsResult>(kind ?? "none", {
    evm: () => ({ publicClient, solana: undefined }),
    solana: () => ({
      publicClient: undefined,
      solana:
        params.rpcUrl !== undefined && params.chainId
          ? resolveChainClientsSolana({
              chainId: params.chainId,
              rpcUrl: params.rpcUrl,
            })
          : contextSolana,
    }),
    none: () => ({ publicClient: undefined, solana: undefined }),
  })
}

/**
 * Imperative chain-dispatch facade — the action-path twin of `useChainClients`
 * for the async create-flow body that cannot call hooks. Classifies once via
 * `resolveChainKind` and resolves only the active chain's clients (the inactive
 * arm stays `undefined`). Carries no `wagmi`/`@solana/*` imports — those live in
 * the leaves. Callers import this from the `chain` barrel, never the leaves.
 */
export function resolveChainClients(params: {
  chainId: string
  rpcUrl: string
}): UseChainClientsResult {
  const kind = resolveChainKind(params.chainId)
  return match<NonNullable<typeof kind> | "none", UseChainClientsResult>(kind ?? "none", {
    evm: () => ({
      publicClient: resolveChainClientEvm({ chainId: params.chainId }),
      solana: undefined,
    }),
    solana: () => ({
      publicClient: undefined,
      solana: resolveChainClientsSolana({
        chainId: params.chainId,
        rpcUrl: params.rpcUrl,
      }),
    }),
    none: () => ({ publicClient: undefined, solana: undefined }),
  })
}
