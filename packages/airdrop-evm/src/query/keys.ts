// The Clique contract query-key registry — EVERY key slice lives HERE in the
// query layer (a query key is cache identity, a query-layer concern, not a
// `contracts/` one). Each family's slice is defined inline below and assembled
// into `airdropEvmKeys`, byte-identical to the legacy flat `evmKeys` registry
// (analysis 6.10) — any drift silently busts caches across consumers. The kit's
// generic `all`+`erc20` registry (`@repo/chain-evm-kit/query`) is separate. The
// query/react layers + the `/keys` subpath consume `airdropEvmKeys`.
//
// Grouped by the contract model (L2 re-home, source layout only): the distributor
// (merkle claim gate + fee/config reads), its strategy attachments the distributor
// composes (lock-hook · linear-penalty · transfer-with-cap), and the standalone
// lock (CliqueLock stream escrow). Every factory + tuple below is BYTE-FROZEN;
// only the grouping/comments changed — the tuples remain the legacy cache identity.

// ── distributor ───────────────────────────────────────────────────────────────
const distributorKeys = {
  merkleRoot: (params: {
    chainId: number
    appId: string
    deployment: string
    batch: string | undefined
    // Merkle-leaf / allocation key (addressHandler); the handler-hash is derived
    // from it, so it is not a separate key dimension.
    handler: string | undefined
  }) => ["evm", "merkle-root", params] as const,
  // The consumption-ledger read (the on-chain `claimed` mapping — a misnamed
  // CONSUMED record).
  allConsumption: () => ["evm", "consumption"] as const,
  consumption: (params: {
    chainId: number
    appId: string
    deployment: string
    batch: string | undefined
    merkleRoot: string | undefined
    // Merkle-leaf / allocation key (addressHandler).
    handler: string | undefined
    dynamicRecipient?: boolean
    distributor: string | undefined
  }) => ["evm", "consumption", params] as const,
  claimedTransactionHash: (params: {
    chainId: number
    appId: string
    deployment: string
    batch: string | undefined
    // Resolved claimer (onBehalfOf) — the `AirdropClaimed(account,…)` event key.
    recipient: string | undefined
    distributor: string | undefined
  }) => ["evm", "claimed-transaction-hash", params] as const,
  allConfigurationIds: () => ["evm", "configuration-ids"] as const,
  configurationIds: (params: {
    chainId: number
    distributor: string | undefined
    root: string | undefined
  }) => ["evm", "configuration-ids", params] as const,
  vault: (params: { chainId: number; distributor: string | undefined }) =>
    ["evm", "vault", params] as const,
  token: (params: { chainId: number; distributor: string | undefined }) =>
    ["evm", "token", params] as const,
  active: (params: { chainId: number; distributor: string | undefined }) =>
    ["evm", "active", params] as const,
  dynamicRecipient: (params: { chainId: number; distributor: string | undefined }) =>
    ["evm", "dynamic-recipient", params] as const,
  allFeeModes: () => ["evm", "fee-mode"] as const,
  feeMode: (params: {
    chainId: number
    distributor: string | undefined
    root: string | undefined
  }) => ["evm", "fee-mode", params] as const,
  allFixedFees: () => ["evm", "fixed-fee"] as const,
  fixedFee: (params: {
    chainId: number
    distributor: string | undefined
    root: string | undefined
  }) => ["evm", "fixed-fee", params] as const,
  allSingleTierFeeRates: () => ["evm", "single-tier-fee-rate"] as const,
  singleTierFeeRate: (params: {
    chainId: number
    distributor: string | undefined
    root: string | undefined
  }) => ["evm", "single-tier-fee-rate", params] as const,
}

// ── distributor strategies ────────────────────────────────────────────────────
// The hooks the distributor composes as weighted Strategy[] attachments. Their
// on-chain reads are addressed off the distributor + configurationId.
const lockHookKeys = {
  streamId: (params: {
    chainId: number
    lockHook: string | undefined
    distributor: string | undefined
    root: string | undefined
    recipient: string | undefined
  }) => ["evm", "stream-id", params] as const,
  streamPreset: (params: {
    lockHook: string | undefined
    distributor: string | undefined
    chainId: number
    configurationId: string | undefined
  }) => ["evm", "stream-preset", params] as const,
}

const configurationKeys = {
  configuration: (params: {
    chainId: number
    distributor: string | undefined
    merkleRoot: string | undefined
    configurationIndex: number
    // Kind resolution depends on the deployment's hook addresses.
    linearPenaltyHook: string | undefined
    lockHook: string | undefined
    transferOrCoinFlipHook: string | undefined
    transferWithCapHook: string | undefined
  }) => ["evm", "configuration", params] as const,
}

const transferWithCapHookKeys = {
  transferCap: (params: {
    chainId: number
    transferWithCapHook: string | undefined
    distributor: string | undefined
    configurationId: string | undefined
  }) => ["evm", "transfer-cap", params] as const,
}

// ── lock ──────────────────────────────────────────────────────────────────────
const lockKeys = {
  stream: (params: { chainId: number; lock: string | undefined; streamId: string | undefined }) =>
    ["evm", "stream", params] as const,
  claimableAmount: (params: {
    chainId: number
    lock: string | undefined
    streamIdentifier: string | undefined
  }) => ["evm", "claimable-amount", params] as const,
  streamRevocation: (params: {
    chainId: number
    lock: string | undefined
    streamId: string | undefined
  }) => ["evm", "stream-revocation", params] as const,
}

/** The Clique contract-family query-key registry (the `/keys` public surface). */
export const airdropEvmKeys = {
  all: () => ["evm"] as const,
  // distributor
  ...distributorKeys,
  // distributor strategies
  ...lockHookKeys,
  ...configurationKeys,
  ...transferWithCapHookKeys,
  // lock
  ...lockKeys,
}
