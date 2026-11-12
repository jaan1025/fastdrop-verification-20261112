// `./react` subpath — HOOKS ONLY. The Clique distributor + lock read/write
// hooks plus the `Use*Parameters` / `Use*Options` hook-parameter types they
// take. Symmetric with EVM `./react`. The queryOptions/mutationOptions factories
// and their data/key types are reached via `./query`; the key registry via
// `./keys`.
//
// ToS hooks (`useEnsureToSSigned`) are NOT re-exported here — the kit owns ToS;
// consumers import them from `@repo/chain-solana-kit/tos-signer` / `/react`.
// Generic token/native/explorer hooks live in `@repo/chain-solana-kit/react`.

// --- merkle-distributor reads + claim mutations ---------------------------
export {
  useDistributor,
  type UseDistributorParameters,
  useConsumption,
  type UseConsumptionParameters,
  useMerkleRoot,
  type UseMerkleRootParameters,
  useConfigurators,
  type UseConfiguratorsParameters,
  useConfiguration,
  type UseConfigurationParameters,
  useClaimTime,
  type UseClaimTimeParameters,
  useClaimStatusPda,
  type UseClaimStatusPdaParameters,
  useStreamPreset,
  type UseStreamPresetParameters,
  useFeeConfig,
  type UseFeeConfigParameters,
} from "./distributor/hooks"

// --- lock STRATEGY bridge reads (streamId derived distributor-side) --------
export {
  useStream,
  type UseStreamParameters,
  useStreamRevocation,
  type UseStreamRevocationParameters,
} from "./distributor/strategies/lock/hooks"
export type { SolanaStreamRevocation } from "../query/distributor/strategies/lock"

// --- clique-lock standalone reads + revoke mutation -----------------------
export {
  useClaimableAmount,
  type UseClaimableAmountParameters,
  useRevokeStream,
  type UseRevokeStreamParameters,
} from "./lock/hooks"
