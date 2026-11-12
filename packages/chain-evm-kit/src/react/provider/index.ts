// `/provider` barrel — the EVM wallet composition-root PROVIDER component (kept out
// of the hooks-only `/react` barrel). The app mounts `<EvmWalletProvider>` at its
// composition root; it wraps `WagmiProvider` + AppKit init + theme sync so the app
// never imports `wagmi` / `@reown/appkit` directly.
export { EvmWalletProvider, type EvmWalletProviderProps } from "../wallet/provider"
