import { keccak256 } from "viem"
import bs58 from "bs58"
import { deriveHandlerHash } from "./handler"

/**
 * [golden-test] The SOLANA handler-hash arm — a strict SUPERSET of the
 * chain-free `deriveHandlerHash`: same behavior on every input except one added
 * branch.
 *
 * WHY IT EXISTS: handler hashing is NOT fully chain-free. An allocation
 * `addressHandler` that is a base58 Solana pubkey must hash as
 * `keccak256(raw 32-byte pubkey)` — exactly what the on-chain
 * `merkle_distributor::claim` expects (`expected_handler =
 * hash(claimer.key().to_bytes())`, clique-lock-svm `instructions/claim.rs`).
 * String-packing that pubkey (what the chain-free arm would do) produces the
 * WRONG bytes, so wallet-handler claims would fail proof verification.
 *
 * WHY IT IS A SEPARATE FUNCTION rather than a branch inside
 * `deriveHandlerHash`: an identity STRING that happens to be valid 32-byte
 * base58 has always string-packed in EVM trees — folding this branch into the
 * shared arm would silently change those EVM hashes (idempotency keys). So the
 * shared preimages live once in `handler.ts` (delegated to, byte-identical) and
 * ONLY the pubkey branch lives here; `computeMerkleLeaf` picks the arm by
 * chain.
 *
 * `bs58.decode` reproduces `@solana/kit`'s `getAddressEncoder().encode` byte
 * output (both are plain base58); a decode failure or a non-32-byte result falls
 * through to string packing, matching the kit-`isAddress` gate byte-for-byte.
 */
export function deriveSolanaHandlerHash(handler?: string, dynamicRecipient = false): `0x${string}` {
  if (dynamicRecipient || !handler) {
    return deriveHandlerHash(handler, dynamicRecipient)
  }
  // EVM-address handler — chain-free-arm-identical (address-packed keccak).
  if (/^0x[a-fA-F0-9]{40}$/.test(handler)) {
    return deriveHandlerHash(handler)
  }
  // base58 Solana pubkey — keccak of the raw 32 address bytes (on-chain match).
  try {
    const bytes = bs58.decode(handler)
    if (bytes.length === 32) {
      return keccak256(Uint8Array.from(bytes))
    }
  } catch {
    // not base58 — fall through to string packing
  }
  // Any other identity (twitter id, email, …) — chain-free-arm-identical.
  return deriveHandlerHash(handler)
}
