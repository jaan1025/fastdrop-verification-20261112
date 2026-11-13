const LINK_KEYS = [
  "x",
  "discord",
  "github",
  "telegram",
  "privacyPolicy",
  "termsOfService",
  "airdropTermsOfService",
] as const
const STRATEGIES = new Set<string>(["transfer", "lock", "penalty"])

export type LinkKey = (typeof LINK_KEYS)[number]
export type ClaimStrategy = "transfer" | "lock" | "penalty"

export type Campaign = {
  acsUrl: string
  appId: string
  deployment: string
  batch?: string
  chainId?: string
  root?: string
  token?: string
}

export type CampaignScope = Pick<Campaign, "acsUrl" | "appId" | "deployment" | "batch">

export type Brief = {
  config: {
    name: string
    token: { name: string; symbol: string }
    meta: { title: string; description: string; keywords: string }
    links: Record<LinkKey, string>
  }
  campaign: Campaign | null
}

export type Verification = {
  chainId: string
  root?: string
  distributor: string
  token: string
  strategies: ClaimStrategy[]
  dynamicRecipient: boolean
  scope: CampaignScope
  solanaBase?: string
}

export type Manifest = {
  schemaVersion: 1
  template: { sha256: string; pinned: boolean }
  campaign: Campaign | null
  verification: Verification | null
}

export type SiteEnvironment = {
  VITE_FASTDROP_MODE: "live"
  VITE_TEST_MODE: "false"
  VITE_APP_ID?: string
  VITE_DEPLOYMENT?: string
  VITE_TARGET_BATCH?: string
  VITE_ACS_API_BASE_URL?: string
  VITE_FASTDROP_ROOT?: string
  VITE_FASTDROP_CHAIN_ID?: string
  VITE_FASTDROP_DISTRIBUTOR?: string
  VITE_FASTDROP_DYNAMIC_RECIPIENT?: string
  VITE_FASTDROP_SOLANA_BASE?: string
}

export function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`)
  return value as Record<string, unknown>
}

function field(value: unknown, label: string, fallback?: string): string {
  if (value == null && fallback !== undefined) return fallback
  if (typeof value !== "string" || !value.trim() || /[\u0000-\u001f\u007f]/u.test(value) || value.length > 500) {
    throw new Error(`${label} must be a nonempty string without control characters.`)
  }
  return value.trim()
}

export function webUrl(value: unknown, label: string, { https = true }: { https?: boolean } = {}): URL {
  try {
    const url = new URL(field(value, label))
    if (url.username || url.password || !(url.protocol === "https:" || (!https && url.protocol === "http:")))
      throw new Error()
    return url
  } catch {
    throw new Error(`${label} must be an ${https ? "HTTPS" : "HTTP(S)"} URL without credentials.`)
  }
}

export function rootHash(value: unknown, label = "root"): string {
  if (typeof value !== "string" || !/^0x[0-9a-f]{64}$/i.test(value) || /^0x0{64}$/i.test(value)) {
    throw new Error(`${label} must be a nonzero 32-byte hex hash.`)
  }
  return value.toLowerCase()
}

export function parseCampaign(value: unknown): Campaign {
  const input = record(value, "campaign")
  if (input.root != null && input.batch == null) throw new Error("campaign.root requires an explicit campaign.batch.")
  const url = webUrl(input.acsUrl, "campaign.acsUrl")
  if (url.search || url.hash) throw new Error("campaign.acsUrl must be a base URL without a query or fragment.")
  return {
    acsUrl: url.href.replace(/\/+$/, ""),
    appId: field(input.appId, "campaign.appId"),
    deployment: field(input.deployment, "campaign.deployment"),
    ...(input.batch != null && { batch: field(input.batch, "campaign.batch") }),
    ...(input.chainId != null && { chainId: field(input.chainId, "campaign.chainId") }),
    ...(input.root != null && { root: rootHash(input.root, "campaign.root") }),
    ...(input.token != null && { token: field(input.token, "campaign.token") }),
  }
}

function normalizeLink(links: Record<string, unknown>, key: LinkKey): string {
  return links[key] == null ? "" : webUrl(links[key], `links.${key}`).href
}

export function parseBrief(value: unknown): Brief {
  const input = record(value, "brief")
  const name = field(input.name, "name")
  const token = input.token == null ? {} : record(input.token, "token")
  const meta = input.meta == null ? {} : record(input.meta, "meta")
  const links = input.links == null ? {} : record(input.links, "links")
  return {
    config: {
      name,
      token: { name: field(token.name, "token.name", name), symbol: field(token.symbol, "token.symbol", "") },
      meta: {
        title: field(meta.title, "meta.title", `${name} Airdrop`),
        description: field(meta.description, "meta.description", `Check your eligibility for the ${name} airdrop.`),
        keywords: field(meta.keywords, "meta.keywords", ""),
      },
      links: {
        x: normalizeLink(links, "x"),
        discord: normalizeLink(links, "discord"),
        github: normalizeLink(links, "github"),
        telegram: normalizeLink(links, "telegram"),
        privacyPolicy: normalizeLink(links, "privacyPolicy"),
        termsOfService: normalizeLink(links, "termsOfService"),
        airdropTermsOfService: normalizeLink(links, "airdropTermsOfService"),
      },
    },
    campaign: input.campaign == null ? null : parseCampaign(input.campaign),
  }
}

export function parseVerification(value: unknown): Verification {
  const input = record(value, "verification")
  const strategies = input.strategies ?? []
  if (
    !Array.isArray(strategies) ||
    (input.root != null && !strategies.length) ||
    !strategies.every((item): item is ClaimStrategy => typeof item === "string" && STRATEGIES.has(item))
  ) {
    throw new Error("Campaign contains an unsupported strategy or has no claim strategy.")
  }
  if (input.root == null && strategies.length)
    throw new Error("Deployment verification cannot include batch strategies without a root.")
  const chainId = field(input.chainId, "verification.chainId")
  if (typeof input.dynamicRecipient !== "boolean")
    throw new Error("Campaign preflight must resolve the recipient mode.")
  return {
    chainId,
    ...(input.root != null && { root: rootHash(input.root, "verification.root") }),
    distributor: field(input.distributor, "verification.distributor"),
    token: field(input.token, "verification.token"),
    strategies: [
      ...new Set(strategies.filter((item): item is ClaimStrategy => typeof item === "string" && STRATEGIES.has(item))),
    ],
    dynamicRecipient: input.dynamicRecipient,
    scope: campaignScope(parseCampaign(input.scope)),
    ...(/^sol:/i.test(chainId) && { solanaBase: field(input.solanaBase, "verification.solanaBase") }),
  }
}

export function campaignScope({ acsUrl, appId, deployment, batch }: CampaignScope): CampaignScope {
  return { acsUrl, appId, deployment, ...(batch != null && { batch }) }
}

export function assertVerifiedCampaign(campaign: Campaign | null, verification: Verification | null): void {
  if (!campaign || !verification)
    throw new Error("A verified campaign is required. Run preflight before preview or build.")
  if (campaign.batch && !verification.root)
    throw new Error("An explicit batch requires its verified root. Run preflight again.")
  const scope = campaignScope(campaign)
  for (const key of ["acsUrl", "appId", "deployment", "batch"] as const) {
    if (scope[key] !== verification.scope[key]) throw new Error(`Campaign ${key} changed. Run preflight again.`)
  }
  const normalize = (value: string): string => (/^0x[0-9a-f]+$/i.test(value) ? value.toLowerCase() : value)
  for (const key of ["chainId", "root", "token"] as const) {
    if (campaign[key] != null && normalize(campaign[key]) !== normalize(verification[key] ?? "")) {
      throw new Error(`campaign.${key} does not match preflight verification.`)
    }
  }
}

export function parseManifest(value: unknown): Manifest {
  const input = record(value, "fastdrop.json")
  const template = record(input.template, "template")
  const sha256 = template.sha256
  const pinned = template.pinned
  if (
    input.schemaVersion !== 1 ||
    typeof sha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(sha256) ||
    typeof pinned !== "boolean"
  ) {
    throw new Error("Unsupported Fastdrop site manifest.")
  }
  return {
    schemaVersion: 1,
    template: { sha256, pinned },
    campaign: input.campaign == null ? null : parseCampaign(input.campaign),
    verification: input.verification == null ? null : parseVerification(input.verification),
  }
}

export function siteEnv(manifest: Pick<Manifest, "campaign" | "verification">): SiteEnvironment {
  const { campaign, verification } = manifest
  if (!campaign || !verification)
    throw new Error("A verified campaign is required. Run preflight before preview or build.")
  assertVerifiedCampaign(campaign, verification)
  return {
    // Old generated sources must stay on their real path until source migration.
    VITE_FASTDROP_MODE: "live",
    VITE_TEST_MODE: "false",
    VITE_APP_ID: campaign.appId,
    VITE_DEPLOYMENT: campaign.deployment,
    ...(campaign.batch && { VITE_TARGET_BATCH: campaign.batch }),
    VITE_ACS_API_BASE_URL: campaign.acsUrl,
    ...(campaign.batch && verification.root && { VITE_FASTDROP_ROOT: verification.root }),
    VITE_FASTDROP_CHAIN_ID: verification.chainId,
    VITE_FASTDROP_DISTRIBUTOR: verification.distributor,
    VITE_FASTDROP_DYNAMIC_RECIPIENT: String(verification.dynamicRecipient),
    ...(verification.solanaBase && { VITE_FASTDROP_SOLANA_BASE: verification.solanaBase }),
  }
}
