// `@repo/chain-solana-kit/utils` barrel — the generic, cross-program Solana
// LEAF primitives a consumer legitimately needs: byte encoders, PDA +
// account decode helpers, RPC validation, and the logger seam. Every re-export
// here originates in a local `./` utils file.
//
// The tx pipeline (walletTx / simulate / lut / budget / lut-cache / explorer /
// wallet-kind detection) now lives behind the `./transaction` door; the error
// formatters behind `./errors`; the message-signing probe behind `./signing`;
// and the native-amount helpers (`LAMPORTS_PER_SOL`, `lamportsToSol`,
// `parseTokenAmount`, `formatSol`) behind `./token`.

// --- byte encoders ---------------------------------------------------------
export {
  toUint8Array,
  concatBytes,
  encodeU32LE,
  encodeU64LE,
  encodeI64LE,
  encodeVector,
  encodeBytes,
} from "./bytes"

// --- account decode + PDA helpers -----------------------------------------
export { fetchAndDecodeAccount } from "./account"
export { createPdaFinder, type PdaResult } from "./pda"

// --- rpc validation -------------------------------------------------------
export { validateRpc, type RpcValidationResult } from "./rpc"

// --- anchor event-log decoding ---------------------------------------------
export { extractAnchorEventPayloads, findAnchorEvent } from "./anchor-event-logs"

// --- logger seam ----------------------------------------------------------
export { setLogger, logger, type Logger } from "./logger"
