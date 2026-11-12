// `functions` barrel: the CliqueDistributor pure contract functions — the reads
// (`./reads`) and the on-chain `claim` write (`./claim`). The `_extra` byte
// producers live at the `../strategies` root (mirroring the Solana arm); their
// core symbols are re-exported here so the `./functions` surface is unchanged.
export {
  buildEvmClaimExtra,
  resolveHookType,
  type HookType,
  type HookContracts,
} from "../strategies/claim-extra"
export { HOOK_STRATEGY_ENCODERS, type HookStrategyEncoder } from "../strategies/hook-encoders"
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
} from "./reads"
export { getClaimedTransactionHash } from "./claimed-transaction-hash"
export { claim } from "./claim"
