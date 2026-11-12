/**
 * Response-side status. clique-acs `store/tx_history.rs` derives serde
 * `Serialize` on `TxStatus` with NO `rename_all`, so the JSON `status` field
 * carries the variant names verbatim — all title-cased. (The `#[sqlx(rename_all
 * = "lowercase")]` attribute governs DB encoding only, and the FromStr filter
 * parse accepts lowercase — but that is the request side, not this response
 * shape.) `TxHistoryRecord.status` is string-widened; this names the known set.
 */
export type TxStatus = "Pending" | "Success" | "Failed"

/**
 * The operation classification written by every relay handler (clique-acs
 * `handler/admin/relay/*` + the `claim` path in `store/relayer.rs`). Backend
 * stores `tx_type` as a free `String`, so consumers must tolerate unknown
 * values; this union names the complete set the backend emits today.
 * `TxHistoryRecord.txType` is string-widened.
 */
export type TxType =
  | "claim"
  | "withdraw"
  | "deploy-distributor"
  | "deploy-cliquelockhook"
  | "deploy-linear-penalty-hook"
  | "deploy-transfer-hook"
  | "set-claim-hook"
  | "set-claim-root"
  | "set-fee"
  | "set-lock-preset"
  | "set-penalty-config"
  | "pause"
  | "unpause"

export interface TxHistoryRecord {
  id: number
  address: string
  txHash: string
  appId: string
  /** Chain (ACS grammar; Solana ops stored under `'0'`). */
  chainId: string
  nonce: string
  status: string
  txType: string
  iss: string
  aud: string
  extra: Record<string, unknown>
  createdAt: string
}

export interface TxHistoryResponse {
  records: TxHistoryRecord[]
  total: number
}

export interface TxHistoryFilters {
  txType?: string
  status?: string
  chainId?: string
  txHash?: string
  /** Filter by JWT issuer (EVM-lowercased at the action). */
  iss?: string
}

export interface TxHistoryQueryParams extends TxHistoryFilters {
  /** Page size, range [1, 200], default 20 server-side. */
  limit: number
  /** Records to skip, default 0. */
  offset: number
}
