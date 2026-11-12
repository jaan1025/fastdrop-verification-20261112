import { WALLET_CONNECT_FALLBACK_PROJECT_ID } from "@repo/shared/constants"

// Shared runtime config every app needs, read once from `import.meta.env` and
// normalized into one typed object. All secrets / endpoints are env-sourced here
// at the composition root (no hardcoded keys). Packages never read env on their
// own — this module flows values into them via providers / config.

const FALLBACK_API_BASE_URL = "https://acs-v4.clique.tech"

const required = (value: string | undefined, fallback: string): string =>
  value && value.length > 0 ? value : fallback

const optional = (value: string | undefined): string | undefined =>
  value && value.length > 0 ? value : undefined

export const runtimeEnv = {
  apiBaseUrl: required(import.meta.env.VITE_API_BASE_URL, FALLBACK_API_BASE_URL),
  walletConnectProjectId: required(
    import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
    WALLET_CONNECT_FALLBACK_PROJECT_ID,
  ),
  solanaRpcUrl: optional(import.meta.env.VITE_SOLANA_RPC_URL),
  solanaWsUrl: optional(import.meta.env.VITE_SOLANA_WS_URL),
} as const

export type RuntimeEnv = typeof runtimeEnv
