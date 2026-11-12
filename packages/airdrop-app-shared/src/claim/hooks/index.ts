// `@repo/airdrop-app-shared/claim/hooks` — the app-layer claim HOOK families
// (L3): chain-dispatch hooks, each a facade (mounts BOTH `-evm`/`-solana` arms
// unconditionally per Rules of Hooks, dispatches via `resolveChainKind`, returns
// the active chain's result) over arms that compose the chain PRIMITIVES DIRECTLY
// — there is NO prepare/submit middle layer. The FROZEN byte producers
// (`buildEvmClaimExtra`, `prepareSolanaClaimExtra`) and the Solana
// `distributorClaim`/`lockHookClaim` pipelines are CALLED, never altered.
//
//   - use-distributor-claim-portal/   self-sign INITIAL claim (ToS → /claim → on-chain)
//   - use-distributor-claim-paymaster/ EVM-only gasless relay claim
//   - use-lock-claim-portal/           self-sign SUBSEQUENT lock-hook claim
export type {
  ClaimHookResult,
  DistributorClaimPortalResult,
  PreparedPortalClaim,
} from "./claim-hook-result"
export {
  useDistributorClaimPortal,
  type UseDistributorClaimPortalInput,
} from "./use-distributor-claim-portal"
export {
  useDistributorClaimPaymaster,
  type UseDistributorClaimPaymasterInput,
} from "./use-distributor-claim-paymaster"
export { useLockClaimPortal, type UseLockClaimPortalInput } from "./use-lock-claim-portal"
