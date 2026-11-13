export type ChainInspection = { chainId: string; root?: string; roles: Record<string, unknown> }
export type InspectionProviders = { alchemyApiKey?: string; solanaRpcUrl?: string; rpcUrl?: string }
export type ChainConfiguration = { token: string; strategies: string[]; dynamicRecipient: boolean; solanaBase?: string }
export type ChainInspector = (
  input: ChainInspection,
  providers: InspectionProviders,
  options?: { signal?: AbortSignal },
) => Promise<ChainConfiguration>
