import type { Commitment } from "@solana/kit"
import type { SolanaChain } from "../config/registry"

/**
 * Generic (token / native / tx) Solana query keys. Clique program keys
 * (merkleRoot/claimedInfo/configurators/stream/penalty/distributor/streamPreset/
 * claimStatusPda) live in `@repo/airdrop-solana/keys`.
 *
 * Chain-aware keys put `chain` right after the hook tag so prefix
 * invalidation can target one cluster at a time:
 *   ['solana', 'native-balance']                   → all clusters
 *   ['solana', 'native-balance', chain]            → one cluster
 *   ['solana', 'native-balance', chain, { addr }]  → one address on one cluster
 */
export const solanaKeys = {
  all: () => ["solana"] as const,

  // --- chain-aware (read on-chain state) --------------------------------
  accountTransactions: (params: {
    chain: SolanaChain
    address: string | undefined
    limit?: number
  }) => {
    const { chain, ...rest } = params
    return ["solana", "account-transactions", chain, rest] as const
  },
  mintInfo: (params: { chain: SolanaChain; mint: string | undefined }) => {
    const { chain, ...rest } = params
    return ["solana", "mint-info", chain, rest] as const
  },
  tokenMetadata: (params: { chain: SolanaChain; mint: string | undefined }) => {
    const { chain, ...rest } = params
    return ["solana", "token-metadata", chain, rest] as const
  },
  allTokenAccounts: () => ["solana", "token-account"] as const,
  tokenAccount: (params: { chain: SolanaChain; tokenAccount: string | undefined }) => {
    const { chain, ...rest } = params
    return ["solana", "token-account", chain, rest] as const
  },
  nativeBalance: (params: {
    chain: SolanaChain
    address: string | undefined
    /** Commitment the balance is read at — keyed so a `finalized` deploy-gate
     *  read and a `confirmed` display read of the same address don't collide. */
    commitment?: Commitment
  }) =>
    [
      "solana",
      "native-balance",
      params.chain,
      { address: params.address, commitment: params.commitment },
    ] as const,
  vaultAta: (params: {
    chain: SolanaChain
    owner: string | undefined
    mint: string | undefined
  }) => {
    const { chain, ...rest } = params
    return ["solana", "vault-ata", chain, rest] as const
  },
}
