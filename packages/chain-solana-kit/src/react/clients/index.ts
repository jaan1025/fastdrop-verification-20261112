// Global Solana client registry — the chainId→{rpc,ws,chain} map (the Solana
// mirror of wagmi's transport map). Seeded at the composition root.
export {
  SolanaClientsProvider,
  useSolanaClients,
  useSolanaReadClients,
  buildSolanaClientsMap,
  solanaEntriesKey,
  type SolanaClientEntry,
  type SolanaClients,
  type SolanaReadClients,
  type SolanaClientsProviderProps,
} from "./solana-clients-provider"
