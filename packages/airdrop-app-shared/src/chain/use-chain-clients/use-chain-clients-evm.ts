import { usePublicClient } from "wagmi"
import { getPublicClient } from "wagmi/actions"
import { getWagmiConfig } from "@repo/chain-evm-kit/config"
import { type WaitForReceiptClient } from "@repo/chain-evm-kit/transaction"

/**
 * EVM leaf of the chain-read-client family: pins a wagmi public client to the
 * SELECTED chain (not the wallet's) for deploy-tx receipt polling. Owns BOTH the
 * action spelling (`getPublicClient` — the non-hook create-flow action path) and
 * the hook spelling (`usePublicClient` — the resume/configuration hook path) in
 * one leaf. Isolates the `wagmi` import.
 */

/**
 * Action-path: returns a wagmi public client pinned to `chainId` via
 * `getPublicClient(getWagmiConfig())`, or `undefined` when no wagmi config is
 * initialised.
 */
export function resolveChainClientEvm(input: {
  chainId: string
}): WaitForReceiptClient | undefined {
  const wagmiConfig = getWagmiConfig()
  if (!wagmiConfig) return undefined
  return getPublicClient(wagmiConfig, { chainId: Number(input.chainId) })
}

/**
 * Hook-path: returns `usePublicClient({ chainId })` pinned to the project's
 * chain. `evmChainId` is `undefined` on Solana projects, which falls back to the
 * wallet's current chain (unused there — Solana awaits finality via the rpc leaf).
 */
export function useChainClientEvm(params: {
  evmChainId: number | undefined
}): WaitForReceiptClient | undefined {
  return usePublicClient({ chainId: params.evmChainId })
}
