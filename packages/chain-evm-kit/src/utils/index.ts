// Curated `/utils` barrel: chain-free-ish low-level EVM LEAF helpers. Every
// re-export here originates in a local `./` utils file (`./address`, `./rpc`).
//
// The tx pipeline (walletTx / detectEvmWalletKind / waitForSafeExecutionByEvent
// / waitForTransactionReceipt / getTransactionExplorerLink + handle types) now
// lives behind the `./transaction` door; the error formatters (catchRevert /
// formatError / toUserError / GENERIC_ERROR_ABIS / ErrorAbis) behind `./errors`.
export { isSmartContractAccount } from "./address"
export {
  validateRpc,
  classifyRpcError,
  type RpcValidationResult,
  type RpcFailureReason,
} from "./rpc"
