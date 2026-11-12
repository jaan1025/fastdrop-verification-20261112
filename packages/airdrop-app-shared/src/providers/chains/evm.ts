// EVM-only door for the chain providers. Split out from the both-chain `index.ts`
// barrel so a consumer that wants ONLY the EVM provider stack (the claim app's
// lazy EVM arm) imports a module whose graph never reaches the Solana provider —
// otherwise a bundler groups the shared barrel's EVM (`init` → AppKit/wagmi) and
// Solana (`solana-root-provider`) transitive deps into one shared chunk, and the
// per-chain lazy split leaks each stack into the other arm. Importing this door
// keeps `createAppKit` / wagmi out of any Solana-only bundle.
export { EvmProvider, type EvmProviderProps } from "./evm-provider"
export { ensureAppKit, type WalletMetadata } from "./init"
