import { keccak256 } from "viem"
import { hexToBytes } from "@repo/shared/utils"

/**
 * [golden-test] The Solana Merkle leaf encoder: build the 40-byte
 * `handlerHash(32) ‖ amount(u64-LE, 8)` preimage, then keccak256 — what
 * `merkle_distributor::claim` verifies. Solana-only. Reached via the `merkle.ts`
 * facade.
 *
 * Note the LITTLE-endian u64 amount, vs EVM's big-endian uint256 — the distinct
 * preimage is why leaves are split, not shared (ARCHITECTURE §7).
 */
export function solanaLeaf(handlerHash: `0x${string}`, amount: bigint): `0x${string}` {
  const amountBytes = new Uint8Array(8)
  for (let i = 0; i < 8; i++) {
    amountBytes[i] = Number((amount >> BigInt(i * 8)) & 0xffn)
  }

  const handlerBytes = hexToBytes(handlerHash)
  const leafData = new Uint8Array(40)
  leafData.set(handlerBytes, 0)
  leafData.set(amountBytes, 32)

  return keccak256(leafData)
}
