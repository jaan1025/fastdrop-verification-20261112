// `/react` barrel — the kit's React entry point: wallet-flow + provider/signer
// hooks, generic token / native / explorer read+write hooks.
// queryOptions/mutationOptions factories, data/key types, and solanaKeys
// are now published via `./query`. Clique distributor/lock hooks live in
// `@repo/airdrop-solana/react`.

// --- providers + signers --------------------------------------------------
export { SolanaProvider, useSolana, type SolanaProviderConfig } from "./components/solana-provider"
export {
  SolanaClientsProvider,
  useSolanaClients,
  useSolanaReadClients,
  type SolanaClientEntry,
  type SolanaClients,
  type SolanaReadClients,
} from "./clients"
export {
  SafeWalletSignersProvider,
  useWalletSigners,
  type WalletSigners,
  type UseWalletSignersResult,
} from "./components/safe-wallet-signers"

// --- wallet / connect hooks (headless) ------------------------------------
export {
  useDisconnect,
  useWatchDisconnect,
  useSolanaConnectModal,
  useSolanaWalletList,
  useEnsureWalletConnected,
  usePreflight,
  type SolanaWalletRow,
  type UseSolanaWalletListResult,
  type EnsureWalletConnectedResult,
  type UseEnsureWalletConnectedResult,
  type UsePreflightResult,
} from "./wallet"
export { useSignMessage } from "./signing"

// --- token / native reads + writes ----------------------------------------
export {
  useMintInfo,
  type UseMintInfoParameters,
  useTokenAccount,
  type UseTokenAccountParameters,
  useNativeBalance,
  type UseNativeBalanceParameters,
  useVaultAta,
  type UseVaultAtaParameters,
  useAccountTransactions,
  type UseAccountTransactionsParameters,
  useTokenMetadata,
  type UseTokenMetadataParameters,
  useNativeTransfer,
  type UseNativeTransferParameters,
  useSplTransfer,
  type UseSplTransferParameters,
  useSplApprove,
  type UseSplApproveParameters,
} from "./token"

// --- cross-program hooks --------------------------------------------------
export { useGetTransactionExplorerLink } from "./use-get-transaction-explorer-link"
export { useGetAddressExplorerLink } from "./use-get-address-explorer-link"
