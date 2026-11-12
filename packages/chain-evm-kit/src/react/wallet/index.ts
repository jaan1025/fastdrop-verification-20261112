// Wallet sub-barrel (internal) — the headless connect/disconnect/preflight
// surface. Exports hooks + their Use*Parameters/Result/Options types only.
export {
  useEnsureWalletConnected,
  type EnsureWalletConnectedResult,
  type EnsureWalletConnectedOptions,
  type UseEnsureWalletConnectedResult,
} from "./use-ensure-wallet-connected"
export { useEnsureChainSwitched } from "./use-ensure-chain-switched"
export {
  useEnsureToSSigned,
  type UseEnsureToSSignedOptions,
  type UseEnsureToSSignedResult,
} from "./use-ensure-tos-signed"
export { usePreflight, type UsePreflightOptions, type UsePreflightResult } from "./use-preflight"
export { useWatchDisconnect } from "./use-watch-disconnect"
// Composition-root provider + account-state surface — the app cannot import wagmi
// directly (strict pnpm isolation), so the kit owns the WagmiProvider mount and the
// account read hooks. See provider.tsx / use-wallet-account.ts.
export { EvmWalletProvider, type EvmWalletProviderProps } from "./provider"
export {
  useWalletAccount,
  useWalletDisconnect,
  useWatchAccount,
  type WalletAccount,
  type WatchAccountHandlers,
} from "./use-wallet-account"
