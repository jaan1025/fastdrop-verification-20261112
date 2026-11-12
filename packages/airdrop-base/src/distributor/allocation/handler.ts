import { type Address, encodePacked, isAddress, keccak256 } from "viem"

/**
 * Computes the keccak256 hash of a Merkle-tree handler — the CHAIN-FREE arm.
 * A handler is the allocation's identity key (`addressHandler`) and comes in
 * three shapes: EVM address, Solana base58 pubkey, or a plain identity string
 * (twitterId, email, …). This arm handles the two chain-agnostic preimages —
 * an EVM address hashes `address`-packed (the raw 20 bytes, matching the
 * on-chain `keccak256(abi.encodePacked(onBehalfOf))`), anything else hashes
 * `string`-packed (UTF-8).
 *
 * WHY TWO FUNCTIONS EXIST: the Solana program instead expects a base58 pubkey
 * handler to hash as its RAW 32 BYTES (`hash(claimer.key().to_bytes())`), so
 * `handler-solana.ts` wraps this arm with exactly that one extra branch. The
 * branch can never be merged in here: an identity STRING that happens to be
 * valid 32-byte base58 has always string-packed in EVM trees — adding the
 * branch would silently change those EVM bytes (the hash is an idempotency
 * key). The merkle facade picks the arm per chain; EVM callers use this one
 * directly.
 */
export function deriveHandlerHash(handler?: string, dynamicRecipient = false): `0x${string}` {
  if (!handler) {
    return "0x"
  }
  // ACS uploads dynamic handler text as raw UTF-8, even if it looks like a wallet address.
  if (!dynamicRecipient && isAddress(handler)) {
    return keccak256(encodePacked(["address"], [handler as Address]))
  }
  return keccak256(encodePacked(["string"], [handler]))
}
