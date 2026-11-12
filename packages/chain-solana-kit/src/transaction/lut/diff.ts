import type { Address } from "@solana/kit"

/**
 * The desired addresses not already in `existing`, deduped, order-preserved.
 * The pure core of the create/extend diff — `ensureLutCovers` appends exactly
 * this set, so an unchanged project is a no-op.
 */
export const diffLutAddresses = (existing: Address[], desired: Address[]): Address[] => {
  const have = new Set<Address>(existing)
  const seen = new Set<Address>()
  const out: Address[] = []
  for (const addr of desired) {
    if (have.has(addr) || seen.has(addr)) continue
    seen.add(addr)
    out.push(addr)
  }
  return out
}
