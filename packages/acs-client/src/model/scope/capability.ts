import type { InspectResult } from "../types/inspect"

/** The prefix dimension of an ACS scope. */
export type Mutability = "read" | "write"
/** The ordered effective capability (none < read < write). */
export type CapabilityLevel = "none" | "read" | "write"

const ALL = "all"
const RANK: Record<CapabilityLevel, number> = { none: 0, read: 1, write: 2 }

export interface ParsedScope {
  /** Permission name with any `read:`/`write:` prefix stripped. */
  permission: string
  /** Read vs write (bare scope ⇒ write). */
  mutability: Mutability
}

/** Parse one ACS scope string. A bare permission (no prefix) is ReadWrite = `write`. */
export const parseScope = (raw: string): ParsedScope => {
  if (raw.startsWith("read:")) return { permission: raw.slice(5), mutability: "read" }
  if (raw.startsWith("write:")) return { permission: raw.slice(6), mutability: "write" }
  return { permission: raw, mutability: "write" }
}

/**
 * Highest mutability of the `all` family in a scope list, else 'none'.
 * Non-`all` scopes (read:appConf, connectAddress, dead triggerClaim/address_binding…)
 * are deliberately ignored — they are recipient/dead scopes, not console capability.
 */
export const maxAllMutability = (scopes: string[]): CapabilityLevel => {
  let level: CapabilityLevel = "none"
  for (const raw of scopes) {
    const { permission, mutability } = parseScope(raw)
    if (permission !== ALL) continue
    if (mutability === "write") return "write"
    level = "read"
  }
  return level
}

const min = (a: CapabilityLevel, b: CapabilityLevel): CapabilityLevel =>
  RANK[a] <= RANK[b] ? a : b

/** True when `level` meets or exceeds `floor` in the none<read<write order. */
export const meetsLevel = (level: CapabilityLevel, floor: CapabilityLevel): boolean =>
  RANK[level] >= RANK[floor]

export interface ResolveOrgCapabilityInput {
  /** inspect.scopes[appId].scopes — the DB grant for one org. */
  inspectScopes: string[]
  /** The JWT `permissions` claim. Callers default to ['all'] when the claim is absent. */
  tokenPermissions: string[]
}

/** Effective capability for one org = min(DB all-level, token all-level). */
export const resolveOrgCapability = (i: ResolveOrgCapabilityInput): CapabilityLevel =>
  min(maxAllMutability(i.inspectScopes), maxAllMutability(i.tokenPermissions))

/**
 * Best capability across every org in an inspect result, each intersected with the
 * token. Used for the login/gate ADMIT decision (any org with access → admit).
 */
export const aggregateCapability = (
  inspect: InspectResult,
  tokenPermissions: string[],
): CapabilityLevel => {
  let best: CapabilityLevel = "none"
  for (const entry of Object.values(inspect.scopes)) {
    const lvl = resolveOrgCapability({
      inspectScopes: entry.scopes,
      tokenPermissions,
    })
    if (RANK[lvl] > RANK[best]) best = lvl
  }
  return best
}
