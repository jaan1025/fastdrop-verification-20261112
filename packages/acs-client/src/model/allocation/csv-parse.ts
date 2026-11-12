import type { ParsedRow, ParseCsvOptions } from "../types/csv"
import { isWalletAddress } from "../address"
import { normalizeScheduleCode, splitScheduleCode } from "./schedule-code"

export const MAX_CSV_ROWS = 10_000

/**
 * [golden-test] Parse + per-row validate an allocation CSV against the server
 * column contract (inverse of `buildCsv`). Resolves header column indices
 * case-insensitively, validates each row (address format, positive finite
 * amount, present + known schedule codes), and flags rows `valid`/`error`.
 * Returns a single invalid row when required columns are missing.
 */
export function parseCsv(text: string, options: ParseCsvOptions): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return []
  const cap = options.maxRows ?? MAX_CSV_ROWS
  const validateAddress = options.validateAddress ?? isWalletAddress

  // Column names follow the legacy/server contract: `address`, `allocation`,
  // `scheduleCode`, `stakeHolder`, `category`. Lowercased here so a stray
  // capital from a hand-edited file still parses.
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const addressIdx = header.indexOf("address")
  const amountIdx = header.indexOf("allocation")
  const scheduleIdx = header.indexOf("schedulecode")
  const categoryIdx = header.indexOf("category")
  const stakeHolderIdx = header.indexOf("stakeholder")

  if (addressIdx === -1 || amountIdx === -1 || scheduleIdx === -1) {
    return [
      {
        recipientAddress: "",
        amount: "",
        scheduleCode: "",
        valid: false,
        error: "Missing required columns (address, allocation, scheduleCode).",
      },
    ]
  }

  return lines.slice(1, 1 + cap).map((line) => {
    const cells = line.split(",").map((c) => c.trim())
    const recipientAddress = cells[addressIdx] ?? ""
    const amountRaw = cells[amountIdx] ?? ""
    const rawScheduleCode = cells[scheduleIdx] ?? ""
    const category = categoryIdx >= 0 ? cells[categoryIdx] || undefined : undefined
    const stakeHolder = stakeHolderIdx >= 0 ? cells[stakeHolderIdx] || undefined : undefined
    // Keep the raw decimal string — DO NOT `Number()` it. A JS number loses
    // precision for big ints / many-decimal / exponential values, which would
    // change the atomic units `parseUnits` produces and fork the merkle root.
    const amount = amountRaw
    const scheduleCode = normalizeScheduleCode(rawScheduleCode)

    if (!validateAddress(recipientAddress)) {
      return {
        recipientAddress,
        amount,
        scheduleCode,
        category,
        stakeHolder,
        valid: false,
        error: "Invalid address format",
      }
    }
    if (!isPositiveDecimalString(amount)) {
      return {
        recipientAddress,
        amount,
        scheduleCode,
        category,
        stakeHolder,
        valid: false,
        error: "Amount must be a positive number",
      }
    }
    if (!scheduleCode) {
      return {
        recipientAddress,
        amount,
        scheduleCode,
        category,
        stakeHolder,
        valid: false,
        error: "Missing schedule code",
      }
    }
    const segments = splitScheduleCode(scheduleCode)
    const unknown = segments.find((s) => !options.validScheduleCodes.has(s))
    if (unknown) {
      return {
        recipientAddress,
        amount,
        scheduleCode,
        category,
        stakeHolder,
        valid: false,
        error: `Unknown schedule code: ${unknown}`,
      }
    }
    return {
      recipientAddress,
      amount,
      scheduleCode,
      category,
      stakeHolder,
      valid: true,
    }
  })
}

/**
 * Positive decimal-string check — the string-domain replacement for the old
 * `Number.isFinite(n) && n > 0`. Accepts plain decimals (`"1000"`,
 * `"0.000001"`, a 30-digit integer); rejects `""`, `"0"`, `"-1"`, `"1e5"`,
 * `"abc"`. No `Number()` round-trip, so big / many-decimal values stay exact for
 * `parseUnits` at build time. (`/[1-9]/` rejects all-zero strings like
 * `"0.00"`.)
 */
function isPositiveDecimalString(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value) && /[1-9]/.test(value)
}
