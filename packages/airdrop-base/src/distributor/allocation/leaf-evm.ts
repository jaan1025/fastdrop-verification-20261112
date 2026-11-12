import { encodePacked, keccak256 } from "viem"

/**
 * [golden-test] The EVM Merkle leaf encoder: `keccak256(encodePacked(['bytes32',
 * 'uint256'], [handlerHash, amount]))` — the 64-byte big-endian preimage
 * `BaseDistributor` verifies. EVM-only. Reached via the `merkle.ts` facade.
 *
 * Distinct preimage from the Solana leaf (40-byte `hash ‖ u64-LE`) — this is why
 * leaves are split rather than shared (ARCHITECTURE §7).
 */
export function evmLeaf(handlerHash: `0x${string}`, amount: bigint): `0x${string}` {
  return keccak256(encodePacked(["bytes32", "uint256"], [handlerHash, amount]))
}
