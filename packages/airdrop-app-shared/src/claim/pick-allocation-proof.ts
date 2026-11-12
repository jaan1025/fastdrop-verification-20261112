import type { Allocation } from "@repo/acs-client/model"

/**
 * The raw claim triple a claim leaf pulls off a matched allocation row: the
 * amount string, the address-handler, and the merkle `proof` coalesced to `[]`.
 * Deliberately UN-validated — the selector never decides whether an empty proof
 * or a missing field is fatal; each call site keeps its own validation gauntlet
 * and its own (portal-vs-admin, user-visible) error messages.
 */
export interface AllocationProof {
  allocation: string
  addressHandler: string
  /**
   * `extra.proof` coalesced to `[]`, passed through by REFERENCE (not copied).
   * Typed as the on-wire hex the distributor verifies — the cast the sites used
   * to spell inline now lives here.
   */
  proof: `0x${string}`[]
}

/**
 * Picks a single batch's allocation row out of the plural `/allocations`
 * response and returns its claim triple. Pure, chain-free — the shared half of
 * the "plural fetch → find(batch) → proof-extract" idiom the claim leaves
 * repeat.
 *
 * Row ABSENT → `undefined` (the ONLY undefined case; the call site decides that
 * this means "allocation not found"). Row PRESENT → the raw triple, WITHOUT any
 * validation: no empty-proof check, no missing-field throw — those stay at the
 * sites so their distinct failure modes and messages are preserved. The proof
 * array is the same reference the row holds.
 */
export function pickAllocationProof(
  allocations: readonly Pick<Allocation, "batch" | "allocation" | "addressHandler" | "extra">[],
  batch: string,
): AllocationProof | undefined {
  const row = allocations.find((a) => a.batch === batch)
  if (!row) return undefined
  return {
    allocation: row.allocation,
    addressHandler: row.addressHandler,
    proof: (row.extra?.proof as `0x${string}`[] | undefined) ?? [],
  }
}
