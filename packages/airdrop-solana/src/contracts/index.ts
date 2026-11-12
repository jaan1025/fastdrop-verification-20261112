// `./contracts` barrel — the pure, React-free MerkleDistributor + CliqueLock
// program surface: the UNION of the two CURATED family sub-barrels
// (`./distributor`, `./lock`). `export *` is sanctioned ONLY at this door over
// curated sub-barrels (the repo's contracts-door idiom, same as airdrop-evm);
// every leaf symbol is still named exactly once, in its family barrel.
// The queryOptions/mutationOptions factories live in `./query`, the hooks in
// `./react`.
export * from "./distributor"
export * from "./lock"
// Transaction utilities: `sendTransaction` + `confirmTransaction` (Clique
// program-error resolver baked into both) + handle type. Mirrors the EVM
// `./contracts` surface so callers never thread the resolver.
export { confirmTransaction, type SolanaTxHandle } from "../transaction/confirm"
export { sendTransaction } from "../transaction/send"
