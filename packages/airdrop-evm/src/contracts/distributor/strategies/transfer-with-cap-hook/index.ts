// `transfer-with-cap-hook` family barrel: the TransferWithCapHook ABI + cap read.
//
// LEGACY (campaign decision D4): the on-chain `TransferWithCapHook` source has
// been REMOVED upstream — only stale build artifacts remain in
// `../clique-lock/out`. This strategy family is retained solely for
// already-deployed instances; its `'transfer-with-cap'` HookType is an address
// alias of plain `transfer` (identical claim `_extra`; see the note in `./abi`
// and `HOOK_STRATEGY_ENCODERS`). Do not build new deployments against it.
export { default as transferWithCapHookAbi } from "./abi"
export { getCap } from "./functions"
