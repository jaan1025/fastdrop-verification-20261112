/**
 * [golden-test] Canonicalize a (possibly colon-joined) schedule code to its
 * canonical form: colon-joined segments sorted alphabetically.
 * `normalizeScheduleCode("b:a")` → `"a:b"`. Byte-identical with the server's
 * canonical key regardless of input order.
 *
 * This is the **WIRE** side of the scheduleCode⇄configuration boundary; the
 * **product keccak derivation** (`deriveScheduleCode`) lives in
 * `@repo/airdrop-base/schedule (code.ts)` — a deliberate two-package boundary, no
 * cross-import (root `.claude/CLAUDE.md`).
 */
export function normalizeScheduleCode(code: string): string {
  const trimmed = code.trim()
  if (!trimmed) return ""
  const parts = trimmed
    .split(":")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (parts.length <= 1) return parts[0] ?? ""
  return [...parts].sort().join(":")
}

/**
 * [golden-test] Split a colon-joined schedule code into its segment codes (in
 * stored order — call `normalizeScheduleCode` first if canonical order matters).
 */
export function splitScheduleCode(code: string): string[] {
  return code
    .split(":")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}
