import { useCallback } from "react"
import { useEnsureChainSwitched } from "./use-ensure-chain-switched"
import {
  useEnsureWalletConnected,
  type EnsureWalletConnectedResult,
} from "./use-ensure-wallet-connected"

export interface UsePreflightOptions {
  /**
   * Numeric EVM chainId the action targets. Required — preflight refuses to
   * run with `0` / `undefined`. The caller supplies it (e.g. resolved from the
   * active project's chain, or received as a prop by a funding modal).
   */
  chainId: number | undefined
}

export interface UsePreflightResult {
  /**
   * Awaits wallet connection (opens AppKit modal if disconnected) AND ensures
   * wagmi is switched to `chainId`. Returns the connected address on success.
   *
   * Throws on:
   *   - `chainId` missing / 0          → "EVM chainId unresolved for preflight"
   *   - user cancels wallet connect    → propagated from `ensureWalletConnected`
   *   - user rejects chain switch      → propagated from `ensureChainSwitched`
   *
   * Callers should let the throw propagate so the existing AsyncTxModal /
   * mutation error path surfaces it.
   */
  preflight: () => Promise<EnsureWalletConnectedResult>
}

/**
 * Per-action EVM wallet preflight — connect → chain-switch — composing this
 * package's `useEnsureWalletConnected` + `useEnsureChainSwitched`. The chain to
 * switch to is the caller's concern (passed as `chainId`). A same-named
 * `usePreflight` exists in `@repo/chain-solana-kit`; a file needing both aliases
 * at the import (e.g. `usePreflight as useEvmPreflight`).
 */
export function usePreflight({ chainId }: UsePreflightOptions): UsePreflightResult {
  const { ensureWalletConnected } = useEnsureWalletConnected()
  const { ensureChainSwitched } = useEnsureChainSwitched({
    chainId: chainId ?? 0,
  })

  const preflight = useCallback(async () => {
    if (!chainId) {
      throw new Error("EVM chainId unresolved for preflight")
    }
    const result = await ensureWalletConnected()
    await ensureChainSwitched(chainId)
    return result
  }, [chainId, ensureWalletConnected, ensureChainSwitched])

  return { preflight }
}
