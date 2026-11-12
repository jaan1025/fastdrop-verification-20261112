import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"

export interface UploadAllocationParams {
  batch: string
  file: File | Blob
  /**
   * SHA-256 hex of the file body (no `0x` prefix). Server compares against the
   * actual file hash and rejects on mismatch.
   */
  fileHash: string
  /**
   * Merkle-leaf row encoding spec (chain-dependent). The caller computes it from
   * this package's `model/allocation` `buildMerkleLeafTemplate({ isSolana })`.
   * Format: `{*<primaryColName>:<encoding>}{<otherColName>:<encoding>}...`
   *   EVM, static recipient:    `{*address:hex}{allocation:uint256}`
   *   Solana, static recipient: `{*address:base58}{allocation:uint64}`
   */
  template: string
  /**
   * CSV column identifying each leaf (recipient) — the `PRIMARY_KEY` constant
   * from `model/allocation`; must match the `*`-flagged template field.
   */
  primaryKey: string
}

export const uploadAllocation = (client: AcsClient, params: UploadAllocationParams) => {
  // Server recognises only `template`, `file_hash`, `primary_key`, `file` —
  // anything else is silently dropped (clique-acs upload_batch.rs wildcard arm).
  const form = new FormData()
  form.append("template", params.template)
  form.append("file_hash", params.fileHash)
  form.append("primary_key", params.primaryKey)
  form.append("file", params.file)

  return client.request<{ root: `0x${string}` }>(
    `/admin/upload/${requireAppId(client, "uploadAllocation")}/${params.batch}`,
    { method: "POST", body: form },
  )
}
