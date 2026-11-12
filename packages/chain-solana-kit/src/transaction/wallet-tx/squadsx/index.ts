// `squadsx/` — all SquadsX-multisig-specific machinery for the Solana tx
// pipeline, in two levels:
//   - handle-level strategy trio (this dir): `isSquadsXWallet`, `squadsxSend`,
//     `squadsxConfirm` — the thin adapters the wallet-tx dispatcher wires in.
//   - Squads domain machinery (`primitives/`): proposal submit + PDA
//     resolution, execution poll loop, the composed confirm, detection, and the
//     wait/timeout message catalog.
//
// `waitForMultisigExecution` is the door-stable alias for the execution poll
// primitive; `../index.ts` re-exports it to keep the `/transaction` door
// surface byte-identical after the split.
export { isSquadsXWallet } from "./primitives/detect"
export { waitForExecution as waitForMultisigExecution } from "./primitives/execution"
export { squadsxSend } from "./send"
export { squadsxConfirm } from "./confirm"
