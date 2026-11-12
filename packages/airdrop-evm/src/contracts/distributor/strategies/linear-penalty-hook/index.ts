// `linear-penalty-hook` family barrel: the LinearPenaltyHook ABI + the penalty
// window read + its `PenaltyTerms` lift. The curve math lives in
// `@repo/airdrop-base/distributor` (`evmPenaltyAmount`).
export { default as linearPenaltyHookAbi } from "./abi"
export { getPenaltyConfig } from "./functions"
export { evmPenaltyTerms } from "./terms"
