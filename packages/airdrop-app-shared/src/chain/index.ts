// Barrel for the generic chain primitives — the single base home for the
// chain-read-client family and per-chain tx-finality dispatch. These are
// chain-free actions (clients passed in / acquired, dispatched on chainKind), a
// base `chain` domain below the console layer. `@repo/console-app-shared`
// consumes these downward (deploy engine, configuration-create, batch-sync,
// project create/resume, distributor-action twins).
export {
  useChainClients,
  resolveChainClients,
  type UseChainClientsResult,
} from "./use-chain-clients"
export { useConfirmTx } from "./use-confirm-tx"
export { confirmTx, type ConfirmTxParams } from "./confirm-tx"
export { ALL_KNOWN_CHAINS, getSupportedChain, chainDisplayName } from "./supported-chains"
export { getDefaultSolanaRpcUrl } from "./default-rpc"
export { getTransactionExplorerLink } from "./get-transaction-explorer-link"
