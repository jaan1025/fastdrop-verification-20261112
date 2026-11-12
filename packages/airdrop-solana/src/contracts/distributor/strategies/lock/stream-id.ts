import { getAddressEncoder, type Address } from "@solana/kit"
import { keccak256, bytesToHex as viemBytesToHex } from "viem"
import { hexToBytes } from "@repo/shared/utils"

const addressEncoder = getAddressEncoder()

/**
 * Derives the deterministic streamId for a clique-lock stream:
 * `keccak256(distributorPda ‖ root ‖ claimer)` — the same preimage the
 * merkle-distributor lock hook uses, so the two derive the SAME stream account.
 */
export const deriveStreamId = (params: {
  distributorPda: Address
  root: Uint8Array
  claimer: Address
}): Uint8Array => {
  const { distributorPda, root, claimer } = params

  const distributorBytes = addressEncoder.encode(distributorPda)
  const claimerBytes = addressEncoder.encode(claimer)

  const combined = new Uint8Array(distributorBytes.length + root.length + claimerBytes.length)
  combined.set(distributorBytes, 0)
  combined.set(root, distributorBytes.length)
  combined.set(claimerBytes, distributorBytes.length + root.length)

  return hexToBytes(keccak256(viemBytesToHex(combined)))
}
