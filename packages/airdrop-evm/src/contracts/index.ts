// `./contracts` barrel — the pure, React-free transport surface: the UNION of
// every CURATED contract-family barrel + extra byte producers. `export *` is
// sanctioned ONLY at this door over curated sub-barrels (the repo's
// contracts-door idiom, same as airdrop-solana); each family names every leaf
// symbol exactly once in its own barrel; this file only unions them. The distributor claim PRIMITIVES (`distributorClaim`,
// `lockHookClaim`) live in their family functions, surfaced through this same
// `./contracts` door. The queryOptions/mutationOptions factories live in `./query`, the
// hooks in `./react`, and the query keys in `./query/keys`.
//
// `sendTransaction` / `confirmTransaction` (both baked with `DEFAULT_ERROR_ABIS`)
// and the `EvmTxHandle` type are exported here. The write ops send via the
// `sendTransaction` facade and `airdrop-app-shared` claim facades confirm via
// `confirmTransaction(handle, { publicClient })` — neither threads the ABI list;
// the Clique DI converges in the two facades.
export * from "./distributor"
export * from "./distributor/strategies"
export * from "./lock"
export * from "./distributor/strategies/lock-hook"
export * from "./distributor/strategies/linear-penalty-hook"
export * from "./distributor/strategies/transfer-hook"
export * from "./distributor/strategies/transfer-with-cap-hook"
export * from "./distributor/strategies/transfer-or-coin-flip-hook"
export { confirmTransaction } from "../transaction/confirm"
export { sendTransaction } from "../transaction/send"
export type { EvmTxHandle } from "@repo/chain-evm-kit/transaction"
