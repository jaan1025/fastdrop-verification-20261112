// `safe/` — all Safe-multisig-specific machinery for the EVM tx pipeline, in
// two levels:
//   - handle-level strategy trio (this dir): `isSafeAccount`, `safeSend`,
//     `safeConfirm` — what the wallet-tx dispatchers wire in. (`safeSend`
//     keeps its body: the fromBlock capture + revert-decoded broadcast IS the
//     handle assembly; the raw submit primitive is the shared
//     `errors/catchRevert`, so there is nothing Safe-specific to push down.)
//   - Safe domain machinery (`primitives/`): the execution-event watcher, the
//     composed confirm, and the threshold-probe detection.
//
// `waitForSafeExecutionByEvent` is the door-stable alias for the execution
// watcher; `../index.ts` re-exports it so the `/transaction` door surface
// stays byte-identical. (Solana mirror: `wallet-tx/squadsx/`.)
export { isSafeAccount } from "./primitives/detect"
export { waitForExecution as waitForSafeExecutionByEvent } from "./primitives/execution"
export { safeSend } from "./send"
export { safeConfirm } from "./confirm"
