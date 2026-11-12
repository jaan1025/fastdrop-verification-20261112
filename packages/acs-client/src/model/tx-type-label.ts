import type { TxType } from "./types/tx-history"

// Null-prototype map so a `txType` naming an `Object.prototype` member
// ("toString", "constructor", …) falls through to the raw string instead of
// resolving a prototype method. Keys are the exact `tx_type` strings the
// clique-acs relay handlers emit (see this package's `TxType`).
const TX_TYPE_LABELS: Record<string, string> = Object.assign(Object.create(null), {
  claim: "Claim",
  withdraw: "Withdraw",
  "deploy-distributor": "Deploy Distributor",
  pause: "Pause",
  unpause: "Unpause",
  "set-claim-hook": "Set Claim Hook",
  "set-claim-root": "Set Claim Root",
  "set-fee": "Set Fee",
  "set-lock-preset": "Set Lock Preset",
  "set-penalty-config": "Set Penalty Config",
  "deploy-cliquelockhook": "Deploy Lock Hook",
  "deploy-linear-penalty-hook": "Deploy Penalty Hook",
  "deploy-transfer-hook": "Deploy Transfer Hook",
})

/** Map an ACS `tx_type` wire string to its human display label. Unknown types
 * fall through to the raw string (no throw, no default placeholder). */
export function txTypeLabel(txType: string): string {
  return TX_TYPE_LABELS[txType] ?? txType
}

/**
 * Tx-type values surfaced in the operations-history filter dropdown, derived
 * from the canonical `TxType` union + labels — a single source kept in sync with
 * the table (which renders via `txTypeLabel`). Typed against `TxType`, so a
 * wire-string drift is a compile error rather than a silently-dead filter
 * option. Omits `set-lock-preset` / `set-penalty-config` (not user-filterable
 * today) — add their keys here to surface them.
 */
const FILTERABLE_TX_TYPES: readonly TxType[] = [
  "claim",
  "withdraw",
  "deploy-distributor",
  "pause",
  "unpause",
  "set-claim-hook",
  "set-claim-root",
  "set-fee",
  "deploy-cliquelockhook",
  "deploy-linear-penalty-hook",
  "deploy-transfer-hook",
]

export const TX_TYPE_OPTIONS: ReadonlyArray<{ value: TxType; label: string }> =
  FILTERABLE_TX_TYPES.map((value) => ({ value, label: txTypeLabel(value) }))
