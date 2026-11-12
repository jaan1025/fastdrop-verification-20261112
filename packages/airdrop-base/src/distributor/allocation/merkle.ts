import { match } from "@repo/shared/utils"
import type { ChainKind } from "@repo/acs-client/model"
import { deriveHandlerHash } from "./handler"
import { deriveSolanaHandlerHash } from "./handler-solana"
import { evmLeaf } from "./leaf-evm"
import { solanaLeaf } from "./leaf-solana"
import { foldRoot } from "./root"
import type { MerkleLeafInput, MerkleRootInput } from "./types"

/**
 * Facade for Merkle leaf + root recompute: derives the CHAIN-CORRECT handler
 * hash, dispatches the chain-specific LEAF preimage via exhaustive
 * `match(chainKind)`, then folds
 * the proof with the chain-free sorted-pair root-fold. The one place a caller
 * computes a leaf/root regardless of chain.
 *
 * The leaf preimages genuinely diverge (EVM 64-byte vs Solana 40-byte) so they are
 * split into `-evm`/`-solana` leaves (L4 tier 2); only the sorted-pair fold is
 * chain-free. Each chain SDK imports its own arm from this kernel rather than
 * chains-solana importing EVM helpers (closes the legacy import leak, ARCHITECTURE §7).
 */

export function computeMerkleLeaf(chainKind: ChainKind, input: MerkleLeafInput): `0x${string}` {
  // The handler hash is per-chain too: the Solana arm keccaks a base58 pubkey's
  // RAW 32 bytes (the on-chain `hash(claimer.key().to_bytes())`), which the
  // chain-free arm would mis-hash as a string. EVM-address / plain-string
  // handlers hash identically on both arms.
  const handlerHash = match(chainKind, {
    evm: () => deriveHandlerHash(input.handler),
    solana: () => deriveSolanaHandlerHash(input.handler),
  })
  return leafFromHandlerHash(chainKind, handlerHash, input.amount)
}

function leafFromHandlerHash(chainKind: ChainKind, handlerHash: `0x${string}`, amount: bigint) {
  return match(chainKind, {
    evm: () => evmLeaf(handlerHash, amount),
    solana: () => solanaLeaf(handlerHash, amount),
  })
}

/** Reuse the same handler hash for the proof, ledger lookup, and transaction. */
export function computeMerkleRootFromHandlerHash(
  chainKind: ChainKind,
  input: Pick<MerkleRootInput, "proof" | "amount"> & { handlerHash: `0x${string}` },
): `0x${string}` {
  return foldRoot(leafFromHandlerHash(chainKind, input.handlerHash, input.amount), input.proof)
}

export function computeMerkleRoot(chainKind: ChainKind, input: MerkleRootInput): `0x${string}` {
  const leaf = computeMerkleLeaf(chainKind, {
    handler: input.handler,
    amount: input.amount,
  })
  return foldRoot(leaf, input.proof)
}
