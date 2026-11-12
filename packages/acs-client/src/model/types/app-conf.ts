export const BATCH_STATUSES = ["Pending", "Approved", "Rejected"] as const
export type BatchStatus = (typeof BATCH_STATUSES)[number]

export interface Batch {
  status: BatchStatus
  /** **Live** schedule/configuration code (wire field for product `scheduleCode`); cleared to `''` on stream revoke. */
  configuration: string
  root: `0x${string}`
  audience: string
  createAt: string
  /** Groups batches uploaded together. */
  requestId?: string
}

export interface LockHookStrategy {
  hook: "lockHook"
  proportion: string
  lockHookConfig: {
    useFixedStartTime: boolean
    startTime: string
    cliffValue: string
    cliffUnit: string
    durationValue: string
    durationUnit: string
    unlockInterval: string
    startUnlockPercentage: string
    cliffUnlockPercentage: string
  }
}

export interface TransferHookStrategy {
  hook: "transferHook"
  proportion: string
}

export interface LinearPenaltyHookStrategy {
  hook: "linearPenaltyHook"
  proportion: string
  penaltyConfig: {
    beginTime: string
    endTime: string
    startPenalty: string
    endPenalty: string
  }
}

export interface CustomHookStrategy {
  hook: "customHook"
  proportion: string
  customAddress: string
}

export type Strategy =
  LockHookStrategy | TransferHookStrategy | LinearPenaltyHookStrategy | CustomHookStrategy

export interface ConfigurationRecord {
  strategy: Strategy[]
  fallbackIdx: string
  displayName?: string
  description?: string
}

export interface DeploymentExtra {
  /** Product type discriminator (the kit's product-scope predicate keys off this). */
  type?: "vesting" | "airdrop"
  root: Record<string, Batch>
  configurations?: Record<string, ConfigurationRecord>
  displayName?: string
  description?: string
  version?: string
  [key: string]: unknown
}

/**
 * Fixed vocabulary of deployment role keys. Values are chain-specific addresses
 * (EVM `0x…`, lowercased for exact-match backend lookups; or Solana base58).
 * Read them through typed accessors rather than indexing `roles` ad-hoc.
 */
export type RoleKey =
  | "contract"
  | "lockHook"
  | "projectAdmin"
  | "signer"
  | "linearPenaltyHook"
  | "transferHook"
  | "transferOrCoinFlipHook"
  | "transferWithCapHook"
  // Solana-only: the project's shared Address Lookup Table (base58). Pure
  // tx-compression metadata — lets multisig admins/recipients fit lock-hook
  // claims (which can't create a LUT on the fly). Read via `solRole(roles, 'lut')`.
  | "lut"

export interface Deployment {
  /** ACS chainId grammar (EVM numeric or `sol:<cluster>`). */
  chainId: string
  rpcUrl: string
  roles: Partial<Record<RoleKey, string>>
  extra: DeploymentExtra
}

export interface AppConfExtra {
  root: Record<string, string>
  /** ToS message template (`{address}`, `{TOS_HASH}` placeholders). */
  tosTemplate?: string
  tosMessage?: string
  partialClaim?: {
    url: string
    responseMapping: string
  }
  [key: string]: unknown
}

export interface AppConf {
  appId: string
  deployments: Record<string, Deployment>
  gated: boolean
  uniqueDevice: boolean
  extra: AppConfExtra
  migrationVersion: number
}
