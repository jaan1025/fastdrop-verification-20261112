import type { AllocationQueryParams, TxHistoryQueryParams } from "../model"

const ROOT = ["acs"] as const

/**
 * Query-key factory. Keys carry only the inputs each endpoint actually depends
 * on — `appId` and `deploymentId` already partition app-scoped data.
 */
export const acsKeys = {
  all: () => [...ROOT] as const,

  public: {
    all: () => [...ROOT, "public"] as const,
    inspect: (handler: string | undefined) => [...ROOT, "public", "inspect", handler] as const,
    health: () => [...ROOT, "public", "health"] as const,
    tos: (appId: string) => [...ROOT, "public", "tos", appId] as const,
    deployment: (params: { appId: string; name: string }) =>
      [...ROOT, "public", "deployment", params] as const,
    userAllocations: (params: { appId: string; deployment: string; address: string | undefined }) =>
      [...ROOT, "public", "user-allocations", params] as const,
    allUserAllocations: (params: { appId: string; address: string | undefined }) =>
      [...ROOT, "public", "all-user-allocations", params] as const,
    connectAddresses: (params: {
      appId: string
      address: string | undefined
      isReverseResolve?: boolean
    }) => [...ROOT, "public", "connect-addresses", params] as const,
  },

  admin: {
    all: () => [...ROOT, "admin"] as const,
    allAppConf: () => [...ROOT, "admin", "app-conf"] as const,
    appConf: (appId: string) => [...ROOT, "admin", "app-conf", appId] as const,
    allAllocations: () => [...ROOT, "admin", "allocations"] as const,
    allocations: (appId: string, params: AllocationQueryParams) =>
      [...ROOT, "admin", "allocations", appId, params] as const,
    batchStats: (appId: string) => [...ROOT, "admin", "batch-stats", appId] as const,
    txHistory: (appId: string, params: TxHistoryQueryParams) =>
      [...ROOT, "admin", "tx-history", appId, params] as const,
    relayers: (appId: string) => [...ROOT, "admin", "relayers", appId] as const,
  },
} as const
