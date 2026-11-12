// Internal sub-barrel of the `./distributor` door. Re-homes the
// Merkle leaf/root computation from the chain SDKs (ARCHITECTURE §2.1/§7); the
// leaf encoders + root-fold stay private behind the facade.

export { computeMerkleRoot, computeMerkleLeaf, computeMerkleRootFromHandlerHash } from "./merkle"
export { deriveHandlerHash } from "./handler"
export { deriveSolanaHandlerHash } from "./handler-solana"
export type { MerkleRootInput, MerkleLeafInput } from "./types"
