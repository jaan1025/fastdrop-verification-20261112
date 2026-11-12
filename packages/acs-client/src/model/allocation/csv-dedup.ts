import { formatUnits, parseUnits } from "viem"
import type { CsvRowInput } from "../types/csv"

/**
 * [golden-test] Per-batch dedup + BigInt sum. Within ONE schedule/configuration
 * group, rows that share a recipient address are merged into a single merkle
 * leaf whose allocation is the BigInt **sum** of the duplicates (atomic units),
 * so a recipient never ends up with two leaves.
 *
 * Mirrors legacy `splitManualRowsByScheduleCodeAtom` (acs-atoms) byte-for-byte:
 *   - dedup key matches `buildCsv` address normalization — EVM lowercased +
 *     trimmed unless `isSolana` (the same `suppressEvmLowercase` flag passed to
 *     `buildCsv`, i.e. Solana OR dynamic-recipient), where it is trimmed only;
 *   - first occurrence wins for code / category / stakeHolder and insertion
 *     order is preserved (Map order = first-seen order);
 *   - the summed atomic value is rendered back with `formatUnits` so the
 *     subsequent `buildCsv` `parseUnits` reproduces the exact same BigInt — the
 *     CSV bytes equal legacy's `rawAllocation.toString()` output.
 *
 * MUST be applied ONLY to the per-batch CSV, never the cross-batch `requestId`
 * CSV: legacy hashes ALL rows un-deduped for the requestId, so deduping there
 * would fork the request identity.
 */
export function dedupeAndSumRows(
  rows: readonly CsvRowInput[],
  tokenDecimals: number,
  isSolana: boolean,
): CsvRowInput[] {
  const byAddress = new Map<string, { row: CsvRowInput; sum: bigint }>()
  for (const r of rows) {
    const trimmed = r.recipientAddress.trim()
    const key = isSolana ? trimmed : trimmed.toLowerCase()
    const atomic = parseUnits(r.amount.trim(), tokenDecimals)
    const existing = byAddress.get(key)
    if (existing) {
      existing.sum += atomic
    } else {
      byAddress.set(key, {
        row: { ...r, recipientAddress: trimmed },
        sum: atomic,
      })
    }
  }
  return Array.from(byAddress.values()).map(({ row, sum }) => ({
    ...row,
    amount: formatUnits(sum, tokenDecimals),
  }))
}
