"use client"
import { usePublicClient } from "wagmi"

/**
 * The EVM public client for a `chainId`, from the global wagmi transport map.
 * The EVM half of the cross-chain "chainId → clients" resolution (mirrors the
 * Solana `useSolanaClients(chainId)`). `undefined` chainId — or a chain not in
 * the wagmi config — yields `undefined`.
 *
 * Thin wrapper so the both-chain facade in `@repo/airdrop-app-shared` can
 * resolve an EVM client without importing `wagmi` directly (wagmi stays confined
 * to `chain-evm-kit` / `-evm` leaves).
 */
export const useEvmPublicClient = (chainId: number | undefined) =>
  usePublicClient(chainId === undefined ? undefined : { chainId })
