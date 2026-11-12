/**
 * Chain-agnostic address display helpers. Pure string operations — no viem
 * import here so this file is safe to load from any package, including ones
 * without a viem dep.
 */

export const ADDRESS_TRUNCATE_PREFIX = 10
export const ADDRESS_TRUNCATE_SUFFIX = 6

export interface TruncateAddressOptions {
  prefix?: number
  suffix?: number
  /** Single-char ellipsis to insert between prefix and suffix. */
  ellipsis?: string
}

/**
 * Shorten an address to `prefix…suffix` form. Shared truncation defaults; the
 * `<WalletAddress>` widget consumes these. Returns the input verbatim when it
 * would not actually shrink under the chosen lengths.
 */
export const truncateAddress = (address: string, options: TruncateAddressOptions = {}): string => {
  const prefix = options.prefix ?? ADDRESS_TRUNCATE_PREFIX
  const suffix = options.suffix ?? ADDRESS_TRUNCATE_SUFFIX
  const ellipsis = options.ellipsis ?? "…"
  if (address.length <= prefix + suffix) return address
  const head = prefix > 0 ? address.slice(0, prefix) : ""
  const tail = suffix > 0 ? address.slice(-suffix) : ""
  return `${head}${ellipsis}${tail}`
}
