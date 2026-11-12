import { encodePacked, keccak256 } from "viem"
import { compareBytes32 } from "@repo/shared/utils"

/**
 * [golden-test] The CHAIN-FREE sorted-pair Merkle root fold: starting from a leaf,
 * at each proof step hash the sorted `[acc, proofElement]` pair (ordered by
 * `compareBytes32`) as two bytes32. Identical on both chains (only the leaf
 * preimage differs). Uses `compareBytes32` from `@repo/shared/utils` (the one
 * comparator home), not a local copy.
 */
export function foldRoot(leaf: `0x${string}`, proof: `0x${string}`[]): `0x${string}` {
  return proof.reduce(
    (acc, proofElement) =>
      keccak256(
        encodePacked(
          ["bytes32", "bytes32"],
          [acc, proofElement].sort(compareBytes32) as [`0x${string}`, `0x${string}`],
        ),
      ),
    leaf,
  )
}
