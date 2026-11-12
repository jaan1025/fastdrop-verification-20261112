// Chain-free fee codec + the decoded fee-config shape.
//
// The codec is a chain-dispatch family (facade + `-evm` / `-solana` leaves);
// the leaves stay family-private. `BatchFeeConfig` is the chain-free shape both
// arms decode to — it co-locates with the codec that formats it. `FeeMode` (the
// relay wire shape the codec encodes to) lives in `@repo/acs-client/model`;
// import it from there.
export { encodeFeeMode, formatBatchFeeConfig } from "./fee-codec"
export { type BatchFeeConfig } from "./fee-config"
