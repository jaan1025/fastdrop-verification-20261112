import { record, siteEnv, type Manifest, type SiteEnvironment } from "./brief.ts"

const MAX_ORIGINS = 20
const MAX_PROVIDER_BYTES = 16 * 1024
const TOKEN_VALUE = /^[a-z0-9._-]{1,160}$/i
export type PreviewPolicy = { env: SiteEnvironment & Record<string, string> }

export const PUBLIC_PROVIDER_KEYS = new Set<string>([
  "VITE_ALCHEMY_API_KEY",
  "VITE_WALLET_CONNECT_PROJECT_ID",
  "VITE_SOLANA_RPC_URL",
  "VITE_SOLANA_WS_URL",
])

export function normalizeAllowedAcsOrigins(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_ORIGINS) {
    throw new Error(`Preview ACS origins must be an array of at most ${MAX_ORIGINS} HTTPS origins.`)
  }
  const origins: string[] = []
  for (const item of value) {
    if (typeof item !== "string" || !item.trim() || item.length > 2_048) {
      throw new Error("Preview ACS origins must be HTTPS origins without a path or credentials.")
    }
    let url
    try {
      url = new URL(item.trim())
    } catch {
      /* Invalid URL. */
    }
    if (
      !url ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname !== "" && url.pathname !== "/")
    ) {
      throw new Error("Preview ACS origins must be HTTPS origins without a path or credentials.")
    }
    if (!origins.includes(url.origin)) origins.push(url.origin)
  }
  return origins
}

function providerValue(name: string, value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 1_000 || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error(`Public provider value for ${name} is invalid.`)
  }
  const normalized = value.trim()
  if (name === "VITE_SOLANA_RPC_URL" || name === "VITE_SOLANA_WS_URL") {
    let url
    try {
      url = new URL(normalized)
    } catch {
      /* Invalid URL. */
    }
    const expected = name === "VITE_SOLANA_WS_URL" ? "wss:" : "https:"
    if (!url || url.protocol !== expected || url.username || url.password || url.hash) {
      throw new Error(
        `Public provider value for ${name} must be a secure ${expected === "wss:" ? "WSS" : "HTTPS"} URL.`,
      )
    }
  } else if (!TOKEN_VALUE.test(normalized)) {
    throw new Error(`Public provider value for ${name} is invalid.`)
  }
  return normalized
}

export function normalizeProviderVars(value: unknown): Record<string, string> {
  const input = value == null ? {} : record(value, "provider variables")
  const result: Record<string, string> = {}
  let bytes = 0
  for (const [name, raw] of Object.entries(input)) {
    if (!PUBLIC_PROVIDER_KEYS.has(name)) {
      throw new Error(`Provider variable ${name} is not in the public browser whitelist.`)
    }
    const setting = providerValue(name, raw)
    bytes += new TextEncoder().encode(name).length + new TextEncoder().encode(setting).length + 2
    if (bytes > MAX_PROVIDER_BYTES) throw new Error("Public provider settings exceed the size limit.")
    result[name] = setting
  }
  return result
}

export function assertLiveProviders(chainId: string, providers: Record<string, string>): void {
  const required = /^sol:/i.test(chainId)
    ? ["VITE_SOLANA_RPC_URL"]
    : ["VITE_ALCHEMY_API_KEY", "VITE_WALLET_CONNECT_PROJECT_ID"]
  const missing = required.filter((key) => !providers[key])
  if (missing.length)
    throw Object.assign(
      new Error("The live website provider settings are incomplete. Contact your Studio administrator."),
      { code: "provider_configuration_missing", providerKeys: missing },
    )
}

export function previewPolicy(
  manifest: Manifest,
  allowedAcsOrigins: readonly string[],
  providerVarsValue: unknown = {},
): PreviewPolicy {
  const env = siteEnv(manifest)
  const providers = normalizeProviderVars(providerVarsValue)
  const origin = new URL(manifest.campaign!.acsUrl).origin
  if (allowedAcsOrigins.length && !allowedAcsOrigins.includes(origin))
    throw new Error("The campaign ACS origin is not in the approved preview origins.")
  assertLiveProviders(manifest.verification!.chainId, providers)
  return { env: { ...env, ...providers } }
}
