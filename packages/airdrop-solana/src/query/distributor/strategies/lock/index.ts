// Lock STRATEGY query layer — the bridge READS (stream + revocation). Both derive
// the streamId from distributor inputs (distributor PDA → keccak identity), so
// they are distributor-side reads of the clique-lock stream account, not
// lock-standalone reads. React-free; the `use*` hooks live in
// `react/distributor/strategies/lock/hooks`.
export {
  solanaStreamQueryOptions,
  type SolanaStreamQueryResult,
  type SolanaStreamData,
  type SolanaStreamQueryKey,
} from "./stream"
export {
  solanaStreamRevocationQueryOptions,
  type SolanaStreamRevocation,
  type SolanaStreamRevocationQueryKey,
} from "./revocation"
