// Penalty STRATEGY — the penalty-hook remaining account + the wire→model lift
// of its on-chain config. The penalty curve MATH lives in
// `@repo/airdrop-base/distributor` (`solanaPenaltyAmount` / `penaltyOutcome`);
// this folder only owns what is chain-bound: the PDA account builder and the
// `PenaltyConfig` account → `PenaltyTerms` adapter.
export { buildPenaltyHookRemainingAccounts } from "./penalty-accounts"
export { solanaPenaltyTerms } from "./terms"
