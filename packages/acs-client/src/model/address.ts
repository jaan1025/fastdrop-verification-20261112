// Format-only check for an EVM address: `0x` + 40 hex chars. Mirrors viem's
// `isAddress(addr, { strict: false })` — checksum is intentionally NOT
// validated, so mixed-case addresses normalise to lowercase for exact-match
// backend lookups.
const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

// Solana base58 alphabet: 1-9, A-H, J-N, P-Z, a-k, m-z. Length 32-44.
const SOLANA_BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

const isEvmAddressFormat = (addr: string): boolean => EVM_ADDRESS_RE.test(addr)

export function normalizeEvmAddress(addr: string): string
export function normalizeEvmAddress(addr: string | undefined): string | undefined
export function normalizeEvmAddress(addr: string | undefined): string | undefined {
  return addr !== undefined && isEvmAddressFormat(addr) ? addr.toLowerCase() : addr
}

// Shallow normalize: return a copy of `params` with each named key passed
// through `normalizeEvmAddress`. Keys whose value isn't a string or undefined
// pass through unchanged. Used by exact-match actions (allocations, auth,
// connect-address, tx-history, inspect, claim, user-allocations).
export const withNormalizedAddresses = <T extends object>(
  params: T,
  keys: readonly (keyof T)[],
): T => {
  const out = { ...params }
  for (const key of keys) {
    const value = params[key]
    if (typeof value === "string" || value === undefined) {
      out[key] = normalizeEvmAddress(value as string | undefined) as T[keyof T]
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Format-level predicates for cross-app reuse (parse-csv, list filters, …)
// ---------------------------------------------------------------------------

/** Loose EVM address check: `0x` + 40 hex chars, case-insensitive. */
export const isEvmAddress = (addr: string): boolean => isEvmAddressFormat(addr)

/**
 * Format-level Solana address check. Verifies the string is base58 in the
 * correct length range; does NOT verify the bytes decode to a valid
 * Ed25519-curve PublicKey. Form layers that want stricter validation should
 * additionally pass the input through `@solana/kit`'s `isAddress`.
 */
export const isSolanaAddressFormat = (addr: string): boolean => SOLANA_BASE58_RE.test(addr)

/** Loose check: EVM or Solana format. */
export const isWalletAddress = (addr: string): boolean =>
  isEvmAddress(addr) || isSolanaAddressFormat(addr)
