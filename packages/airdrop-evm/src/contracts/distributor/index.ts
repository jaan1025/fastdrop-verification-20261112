// `distributor` family barrel: the CliqueDistributor pure contract functions +
// ABI. The reads + the on-chain `claim` write live in `./functions` (the reads
// in `./functions/reads`, the claim core in `./functions/claim`); the `_extra`
// byte producers at the `./strategies` root; query-key slices in `../../query/keys`.
// The other hook families are the distributor's strategy attachments — they live
// under `./strategies/` (`./strategies/transfer-hook`,
// `./strategies/transfer-with-cap-hook`, `./strategies/transfer-or-coin-flip-hook`,
// `./strategies/linear-penalty-hook`, `./strategies/lock-hook`).
export { default as distributorAbi } from "./abi"
export {
  getRequiredFee,
  getToken,
  getVault,
  getActive,
  getDynamicRecipient,
  getFeeMode,
  getFixedFee,
  getSingleTierFeeRate,
  getConsumption,
  getConfigurationIds,
  getConfigurationIdAt,
  getStrategies,
  getClaimedTransactionHash,
  claim as distributorClaim,
} from "./functions"
// On-chain batch config → base `Configuration` (+ the penaltyConfigs →
// PenaltyTerms lift). The penalty curve math itself lives in
// `@repo/airdrop-base/distributor`.
export { resolveConfiguration, STRATEGY_KIND_BY_HOOK_TYPE } from "./strategies/configuration"
export { evmPenaltyTerms } from "./strategies/linear-penalty-hook/terms"
