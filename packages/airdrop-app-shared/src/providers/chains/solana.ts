// Solana-only door for the chain providers (mirror of `evm.ts`). Split out from
// the both-chain `index.ts` barrel so the claim app's lazy Solana arm imports a
// module whose graph never reaches the EVM provider (`init` → AppKit/wagmi) —
// keeping `@solana/*` / `wallet-standard` out of any EVM-only bundle and keeping
// AppKit out of a Solana-only bundle.
export { SolanaRootProvider, type SolanaRootProviderProps } from "./solana-root-provider"
