// wallet sub-barrel (internal) — the headless connect/disconnect/preflight
// surface. The connect-modal JSX re-homes to `@repo/airdrop-app-shared`; this
// package exposes only the headless controls + wallet-list view-model.
export { useDisconnect } from "./use-disconnect"
export { useWatchDisconnect } from "./use-watch-disconnect"
export { useSolanaConnectModal } from "./use-solana-connect-modal"
export {
  useSolanaWalletList,
  type SolanaWalletRow,
  type UseSolanaWalletListResult,
} from "./use-solana-wallet-list"
export {
  useEnsureWalletConnected,
  type EnsureWalletConnectedResult,
  type UseEnsureWalletConnectedResult,
} from "./use-ensure-wallet-connected"
export { usePreflight, type UsePreflightResult } from "./use-preflight"
