// transaction sub-barrel (internal) — the simulate → sign → send → confirm
// pipeline + LUT compression. Low-level primitives stay at the root;
// wallet-aware high-level API lives in ./wallet-tx/.

// --- low-level primitives ---------------------------------------------------
export { confirm, type ConfirmParams } from "./confirm"
export { simulate, type SimulationResult } from "./simulate"
export { type SendableTransaction } from "./types"
export {
  ensureTxFits,
  ensureLutCovers,
  previewLutCoverage,
  diffLutAddresses,
  LUT_MAX_ADDRESSES,
  type EnsureLutCoversParams,
  type EnsureLutCoversResult,
  type PreviewLutCoverageResult,
} from "./lut"

// --- compute budget ---------------------------------------------------------
export { getComputeBudgetInstructions, DEFAULT_COMPUTE_UNITS, DEFAULT_PRIORITY_FEE } from "./budget"

// --- LUT cache (per-key reuse across contract attempts) ---------------------
export { getLutCache, setLutCache } from "./lut-cache"

// --- block-explorer tx links ------------------------------------------------
export { getTransactionExplorerLink, type SolanaExplorerOptions } from "./explorer"

// --- tx-kind detection (lives with the tx strategies) -----------------------
export { isMultisigWallet } from "./wallet-tx/detect"
export { isSquadsXWallet } from "./wallet-tx/squadsx"

// --- wallet-aware API (walletTx namespace + handle types + detect/exec wait) -
export {
  walletTx,
  confirmTransaction,
  detectSolanaWalletKind,
  waitForMultisigExecution,
  type ConfirmTransactionContext,
  type SendTransactionParams,
  type SolanaWalletKind,
  type SolanaTxHandle,
} from "./wallet-tx"
