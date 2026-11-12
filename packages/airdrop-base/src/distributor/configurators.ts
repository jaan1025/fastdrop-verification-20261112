import { keccak256, toBytes, type Hex } from "viem"

/**
 * [golden-test] keccak256 each colon-delimited code in `configuration`. Empty
 * configuration → empty array (legacy semantics: empty = revoke). The relay
 * configuration payload depends on this; do not change.
 */
export function expectedConfigurators(configuration: string): Hex[] {
  if (!configuration) return []
  return configuration.split(":").map((code) => keccak256(toBytes(code)))
}

/**
 * True when the on-chain configurator list matches the expected (desired) one.
 * `null` on-chain means "no claim root set" — synced only when expected is also
 * empty (a revoked batch: desired empty == on-chain empty == Synced). Compared
 * by index, case-insensitive (hex).
 */
export function configuratorsMatch(expected: Hex[], onChain: readonly Hex[] | null): boolean {
  if (onChain === null) return expected.length === 0
  if (onChain.length !== expected.length) return false
  return expected.every((e, i) => e.toLowerCase() === onChain[i].toLowerCase())
}
