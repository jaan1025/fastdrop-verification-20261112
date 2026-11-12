/**
 * One parsed CSV data row. `valid` and `error` reflect per-row validation
 * inside `parseCsv`; consumers stage these for review before submitting.
 */
export interface ParsedRow {
  recipientAddress: string
  /**
   * Human-readable allocation, kept as the **raw decimal string** the user
   * typed / the CSV carried — never round-tripped through a JS `number` (that
   * loses precision for values > 2^53, many-decimal, or exponential inputs and
   * would fork the byte-stable merkle root). Scaled to atomic units via
   * `parseUnits(amount, decimals)` at build time.
   */
  amount: string
  /** Schedule code — possibly colon-joined for multi-schedule rows (`a:b:c`),
   * always stored in canonical sorted form via `normalizeScheduleCode`. */
  scheduleCode: string
  category?: string
  stakeHolder?: string
  valid: boolean
  error?: string
}

export interface ParseCsvOptions {
  validScheduleCodes: Set<string>
  /** Hard cap on data rows. Default `MAX_CSV_ROWS` (10_000). */
  maxRows?: number
  /**
   * Custom address validator. Defaults to acs-client's format-only check
   * (`isWalletAddress` — EVM hex format + Solana base58 format). Consumers
   * that need stricter validation (e.g. Ed25519-curve check for Solana via
   * `@solana/kit`) should pass a tighter predicate here so format-valid but
   * cryptographically invalid addresses are rejected at parse time.
   */
  validateAddress?: (address: string) => boolean
}

/**
 * Minimum row shape `buildCsv` reads. Any consumer-side row type (UI
 * `ImportRow`, plain data dump, …) is structurally assignable — pass it
 * straight to `buildCsv` without re-mapping.
 */
export interface CsvRowInput {
  recipientAddress: string
  /** Raw decimal string (see `ParsedRow.amount`) — scaled with `parseUnits` at
   * build time, never coerced through a JS `number`. */
  amount: string
  scheduleCode: string
  category?: string
  stakeHolder?: string
}
