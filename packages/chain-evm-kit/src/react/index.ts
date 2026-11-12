// `/react` barrel — HOOKS ONLY. Factories/keys live in `./query`. The ToS host
// (EvmToSSigner) is published via `./tos-signer`.
// Curated: explicit named exports, NOT `export *`. Clique contract hooks
// (distributor/lock/lockHook/penalty/cap) live in `@repo/airdrop-evm`'s
// own `/react` barrel.

// --- wallet / connect hooks (headless) -----------------------------------
export {
  useEnsureWalletConnected,
  type EnsureWalletConnectedResult,
  type EnsureWalletConnectedOptions,
  type UseEnsureWalletConnectedResult,
  useEnsureChainSwitched,
  useEnsureToSSigned,
  type UseEnsureToSSignedOptions,
  type UseEnsureToSSignedResult,
  usePreflight,
  type UsePreflightOptions,
  type UsePreflightResult,
  useWatchDisconnect,
  // Account-state hooks — the app cannot import wagmi directly (strict pnpm
  // isolation); the kit re-exposes the connected address / disconnect / watch.
  useWalletAccount,
  useWalletDisconnect,
  useWatchAccount,
  type WalletAccount,
  type WatchAccountHandlers,
} from "./wallet"

// --- native token reads + writes -----------------------------------------
export {
  useNativeBalance,
  type EvmNativeBalance,
  type UseNativeBalanceParameters,
  useNativeTransfer,
  type UseNativeTransferParameters,
} from "./token"

// --- ERC-20 token reads + writes -----------------------------------------
export {
  useTokenInfo,
  type UseTokenInfoParameters,
  useTokenSymbol,
  type UseTokenSymbolParameters,
  useTokenDecimals,
  type UseTokenDecimalsParameters,
  useTokenName,
  type UseTokenNameParameters,
  useTotalSupply,
  type UseTotalSupplyParameters,
  useTokenBalance,
  type UseTokenBalanceParameters,
  useTokenAllowance,
  type UseTokenAllowanceParameters,
  useTokenApprove,
  type UseTokenApproveParameters,
  useTokenTransfer,
  type UseTokenTransferParameters,
} from "./token"

// --- cross-cutting hooks --------------------------------------------------
export { useGetTransactionExplorerLink } from "./use-get-transaction-explorer-link"
export { useEvmPublicClient } from "./use-evm-public-client"
