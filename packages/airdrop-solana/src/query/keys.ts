import type { SolanaChain } from "@repo/chain-solana-kit/config"

/**
 * Clique program query keys (merkleRoot / consumption / configurators / stream /
 * configuration / distributor / streamPreset / claimStatusPda /
 * claimableAmount). Generic token/native/tx keys live in
 * `@repo/chain-solana-kit/query`.
 *
 * Chain-aware keys put `chain` right after the hook tag so prefix invalidation
 * can target one cluster at a time:
 *   ['solana', 'stream']                   → all clusters
 *   ['solana', 'stream', chain]            → one cluster
 *   ['solana', 'stream', chain, { ... }]   → one entity on one cluster
 */
export const airdropSolanaKeys = {
  all: () => ["solana"] as const,

  // --- chain-independent (ACS-backed or pure derivation) ----------------
  merkleRoot: (params: {
    appId: string
    deployment: string
    batch: string | undefined
    // Merkle-leaf / allocation key (addressHandler).
    handler: string | undefined
  }) => ["solana", "merkle-root", params] as const,
  claimableAmount: (params: { streamIdentifier: string | undefined }) =>
    ["solana", "claimable-amount", params] as const,
  claimStatusPda: (params: {
    base: string | undefined
    root: string | undefined
    // Merkle-leaf / allocation key (addressHandler).
    handler: string | undefined
  }) => ["solana", "claim-status-pda", params] as const,

  // --- chain-aware (read on-chain state) --------------------------------
  // The consumption-ledger read (ClaimStatus — its wire `claimed` field is a
  // misnamed CONSUMED record).
  consumption: (params: {
    chain: SolanaChain
    appId: string
    deployment: string
    batch: string | undefined
    base: string | undefined
    root: string | undefined
    // Merkle-leaf / allocation key (addressHandler).
    handler: string | undefined
    dynamicRecipient?: boolean
  }) => {
    const { chain, ...rest } = params
    return ["solana", "consumption", chain, rest] as const
  },
  allConfigurators: () => ["solana", "configurators"] as const,
  configurators: (params: {
    chain: SolanaChain
    appId: string
    deployment: string
    batch: string | undefined
    base: string | undefined
    root: string | undefined
  }) => {
    const { chain, ...rest } = params
    return ["solana", "configurators", chain, rest] as const
  },
  stream: (params: {
    chain: SolanaChain
    base: string | undefined
    root: string | undefined
    // Resolved claimer (extra.recipient ?? addressHandler) — streamId key.
    recipient: string | undefined
  }) => {
    const { chain, ...rest } = params
    return ["solana", "stream", chain, rest] as const
  },
  revocation: (params: {
    chain: SolanaChain
    base: string | undefined
    root: string | undefined
    // Resolved claimer (extra.recipient ?? addressHandler) — streamId key.
    recipient: string | undefined
  }) => {
    const { chain, ...rest } = params
    return ["solana", "stream-revocation", chain, rest] as const
  },
  configuration: (params: {
    chain: SolanaChain
    base: string | undefined
    root: string | undefined
    configurationIndex: number
  }) => {
    const { chain, ...rest } = params
    return ["solana", "configuration", chain, rest] as const
  },
  claimTime: (params: { chain: SolanaChain; lastSlot: string | undefined }) => {
    const { chain, ...rest } = params
    return ["solana", "claim-time", chain, rest] as const
  },
  distributor: (params: { chain: SolanaChain; distributor: string | undefined }) => {
    const { chain, ...rest } = params
    return ["solana", "distributor", chain, rest] as const
  },
  streamPreset: (params: {
    chain: SolanaChain
    distributor: string | undefined
    configurator: string | undefined
  }) => {
    const { chain, ...rest } = params
    return ["solana", "stream-preset", chain, rest] as const
  },

  // --- FeeConfig PDA detail (migrated from console-app-shared `feeKeys`, S2) ---
  // These two keys deliberately break the `['solana', …]` convention above: they
  // keep the EXACT `['fees', 'solana-fee-config-detail', …]` tuple the console
  // `feeKeys` used, so relocating ownership here preserves cache identity (any
  // byte drift would silently bust in-flight caches AND the invalidation prefix).
  // `allFeeConfig` is the broad prefix `invalidateAfterSync` targets after a
  // Solana set-fee; `feeConfig` is the per-(chain, distributor, root) detail read.
  allFeeConfig: () => ["fees", "solana-fee-config-detail"] as const,
  feeConfig: (params: {
    chain: SolanaChain
    distributor: string | undefined
    root: `0x${string}` | undefined
  }) =>
    [
      "fees",
      "solana-fee-config-detail",
      params.chain,
      { distributor: params.distributor, root: params.root },
    ] as const,
}
