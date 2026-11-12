import { parseUnits } from "viem"
import type { CsvRowInput } from "../types/csv"
import type { ChainKind } from "../chain"

/**
 * [golden-test] Canonical column order — `category` BEFORE `stakeHolder`. Must
 * match the legacy admin app byte-for-byte: the same rows produce the same
 * fileHash, which produces the same `STR<hash>` batch name, which the server
 * treats as the idempotency key for an upload.
 */
export const CSV_HEADER = "address,allocation,scheduleCode,category,stakeHolder"

/** [golden-test] Primary key column used by the merkle-leaf template. */
export const PRIMARY_KEY = "address"

/**
 * [golden-test] Build the per-batch CSV body. Joined with `\n` and **no
 * trailing newline** — a trailing newline would change the sha256 and break
 * cross-app idempotency. EVM addresses lowercased; Solana base58 preserved
 * as-is. The human `amount` is scaled to atomic units via `parseUnits(amount,
 * decimals)`; the server stores the result as bigint and expects a column
 * literally named `allocation`.
 *
 * **Sanctioned dual-format both-chain file** (root `.claude/CLAUDE.md`) —
 * `buildCsv` legitimately takes an `isSolana` flag and ships whole; do NOT split
 * into chain leaves (splitting would change a byte preimage).
 */
export function buildCsv(
  rows: readonly CsvRowInput[],
  tokenDecimals: number,
  isSolana: boolean,
): string {
  const lines = [CSV_HEADER]
  for (const r of rows) {
    const address = isSolana ? r.recipientAddress : r.recipientAddress.toLowerCase()
    const allocation = parseUnits(r.amount, tokenDecimals).toString()
    lines.push(
      [address, allocation, r.scheduleCode, r.category ?? "", r.stakeHolder ?? ""]
        .map(escapeCsvCell)
        .join(","),
    )
  }
  return lines.join("\n")
}

/**
 * RFC 4180 cell escape — quote on `,`, `"`, `\r`, or `\n`; double `"` inside
 * quoted fields. **Internal** (L5): no external consumer, keeps the byte
 * contract encapsulated.
 */
function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * [golden-test] Chain-aware merkle-leaf **template** — describes how the server
 * hashes each CSV row into a 32-byte leaf (the wire instruction). The `*`-prefixed
 * column must equal `PRIMARY_KEY` and a column literally named `allocation` is
 * hard-required (see `UploadAllocationParams.template`). Encodings:
 *
 *   - EVM,    static    → `{*address:hex}{allocation:uint256}`
 *   - Solana, static    → `{*address:base58}{allocation:uint64}`
 *   - dynamicRecipient  → `{*address:raw}{allocation:<uint256|uint64>}`
 *
 * **`dynamicRecipient` mode** (project's distributor binds the raw address-handler
 * payload, not a chain-typed address): the address column becomes `raw`, while the
 * allocation width STILL follows the chain (EVM `uint256` / Solana `uint64`). This
 * arm was folded in from airdrop-console's former `uploadTemplateFor`; the static
 * arms are byte-identical to what this builder emitted before the fold.
 *
 * **EVM-lowercasing-suppression invariant (acs-client contract).** In
 * `dynamicRecipient` mode the address is the raw handler payload, so the CALLER
 * MUST emit the address column verbatim — i.e. skip the EVM lowercasing /
 * dedup-normalization it would otherwise apply to a hex address. Concretely the
 * caller must OR `dynamicRecipient` into the `isSolana` (lowercasing-suppress)
 * flag it passes to `buildCsv` / `dedupeAndSumRows`. Forgetting this forks every
 * leaf hash for dynamic-recipient projects. Only the address encoding flips to
 * `raw`; the allocation width never changes.
 *
 * Distinct from the frontend leaf **computation** (which lives in
 * `@repo/airdrop-base/distributor`). Sanctioned both-chain file — dispatches on
 * `ChainKind` and ships whole; do NOT split into chain leaves.
 */
export function buildMerkleLeafTemplate(opts: {
  chainKind: ChainKind
  /**
   * Project's distributor is in dynamic-recipient mode. Defaults to `false`
   * (static recipient). When true the address encoding is `raw`; see the
   * EVM-lowercasing-suppression invariant above.
   */
  dynamicRecipient?: boolean
}): string {
  const allocationEncoding = opts.chainKind === "solana" ? "uint64" : "uint256"
  const addressEncoding = opts.dynamicRecipient
    ? "raw"
    : opts.chainKind === "solana"
      ? "base58"
      : "hex"
  return `{*${PRIMARY_KEY}:${addressEncoding}}{allocation:${allocationEncoding}}`
}

/**
 * [golden-test] `STR<last-6-of-hex>` — idempotency-key batch name; uploading the
 * same CSV content yields the same batch identifier. The server treats this as
 * an idempotency key. Accepts both `0x…` and bare-hex sha256 outputs; only the
 * last 6 hex chars matter, so prefix handling is implicit.
 */
export function deriveBatchName(fileHash: string): string {
  return `STR${fileHash.slice(-6)}`
}
