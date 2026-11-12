// Chain-dispatch family barrel — re-exports only the facade's public surface
// (the hook + its imperative twin). The `-evm` / `-solana` leaves are
// intentionally NOT re-exported.
export {
  useChainClients,
  resolveChainClients,
  type UseChainClientsResult,
} from "./use-chain-clients"
