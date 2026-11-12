import { computeMerkleRoot, deriveSolanaHandlerHash } from "@repo/airdrop-base/distributor"
import { hexToBytes } from "@repo/shared/utils"

/**
 * [golden-test] Solana merkle derivations — thin delegations to the kernel's
 * Solana arm (`@repo/airdrop-base/distributor`). The base58-pubkey handler
 * branch, the 40-byte LE-u64 leaf, and the sorted-pair fold all live in the
 * kernel now (goldens pinned there in `handler-solana.test.ts`); this module
 * keeps only the on-chain param adapters, byte-parity-pinned by `merkle.test.ts`.
 */

/** Raw bytes of a Solana handler hash — used as the on-chain `handler` arg. */
export const solanaHandlerBytes = (handler?: string, dynamicRecipient = false): Uint8Array =>
  hexToBytes(deriveSolanaHandlerHash(handler, dynamicRecipient))

/**
 * [golden-test] Recompute the Solana merkle root from a proof: Solana-aware
 * handler hash → 40-byte Solana leaf → sorted-pair fold, via the kernel's
 * Solana arm. Byte-identical to the legacy
 * `getRoot(proof, getHandlerHash(handler), amount)`.
 */
export const computeSolanaRoot = (params: {
  proof: `0x${string}`[]
  handler: string
  amount: bigint
}): `0x${string}` =>
  computeMerkleRoot("solana", {
    proof: params.proof,
    handler: params.handler,
    amount: params.amount,
  })
