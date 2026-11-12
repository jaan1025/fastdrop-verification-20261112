import { useCallback } from "react"
import {
  useEnsureWalletConnected,
  type EnsureWalletConnectedResult,
} from "./use-ensure-wallet-connected"

export interface UsePreflightResult {
  /**
   * Awaits Solana wallet connection (opens the Solana connect modal if
   * disconnected). Returns the connected `{ wallet, account }` on success.
   *
   * Solana has no analogue to EVM `ensureChainSwitched`: the cluster is
   * route-driven via `SolanaRootProvider` reading the active project's
   * `chainId`, and wallet-standard wallets don't expose a dApp-side cluster
   * switch RPC. If the user's wallet is set to a different cluster in its
   * UI, on-chain reads/writes fail with account-not-found-style errors which
   * surface through the regular mutation error path.
   *
   * Throws when the user cancels — let it propagate so the calling modal
   * lands in its error state.
   */
  preflight: () => Promise<EnsureWalletConnectedResult>
}

/**
 * Per-action Solana wallet preflight — one step: connect. The EVM counterpart
 * (`usePreflight` in `@repo/chain-evm-kit`) adds a chain-switch; kept separate
 * (not unified) because the chains' connect primitives + result shapes diverge.
 * A file needing both aliases at the import (e.g. `usePreflight as
 * useSolanaPreflight`).
 */
export function usePreflight(): UsePreflightResult {
  const { ensureWalletConnected } = useEnsureWalletConnected()

  const preflight = useCallback(async () => {
    return await ensureWalletConnected()
  }, [ensureWalletConnected])

  return { preflight }
}
