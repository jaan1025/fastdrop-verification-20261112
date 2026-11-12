"use client"
import { useEffect, useState, type ReactNode } from "react"
import { WagmiProvider } from "wagmi"
import { getAppKit, getWagmiConfig } from "../../config"

// The EVM wallet composition-root provider + its account-state hooks. This is the
// ONE place the app mounts the wagmi context: the app's composition root cannot
// import `wagmi` / `@reown/appkit` directly (pnpm strict isolation keeps them in
// this kit's own node_modules), so the kit owns the provider and re-exports the
// account surface. Chain-specific imports stay behind this `-evm` leaf per the
// multi-chain boundary rule.
//
// AppKit itself is NOT constructed here. The app calls `ensureAppKit` (from
// `@repo/chain-evm-kit/config`) at module scope BEFORE this provider renders —
// building AppKit during render interleaves its async session restore with
// React mount/hydration + wagmi's `reconnectOnMount` and corrupts AppKit's
// per-namespace network state. This provider only reads the already-built wagmi
// config and mounts `WagmiProvider`.

export interface EvmWalletProviderProps {
  children: ReactNode
  /**
   * Resolved theme to sync the AppKit modal to (e.g. next-themes' resolvedTheme).
   * Optional — the modal keeps its `themeMode` when omitted.
   */
  resolvedTheme?: "dark" | "light"
  /** Reconnect the last wallet on mount (wagmi `reconnectOnMount`). Default true. */
  reconnectOnMount?: boolean
}

/**
 * Wagmi host with a mount boundary.
 *
 * The AppKit-backed wagmi config can only be read after `ensureAppKit` has run
 * on the client, so we defer to a post-mount effect: the first paint matches the
 * SSR shell (children without the wagmi provider), the next paint mounts with the
 * config. Rendering `null` for wagmi context but still passing children through
 * would break descendants that call wagmi hooks unconditionally, so we hold the
 * whole subtree until config is ready — descendants never need an "is wagmi
 * ready" check. The theme sync also waits for the modal (`getAppKit`) to exist.
 *
 * All supported EVM chains are baked into the config at init — no per-chain
 * provider scoping; consumers pass `chainId` per call and wagmi picks the
 * transport.
 */
export const EvmWalletProvider = ({
  children,
  resolvedTheme,
  reconnectOnMount = true,
}: EvmWalletProviderProps) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !resolvedTheme) return
    getAppKit()?.setThemeMode(resolvedTheme)
  }, [mounted, resolvedTheme])

  const config = mounted ? getWagmiConfig() : undefined
  if (!config) return null

  return (
    <WagmiProvider config={config} reconnectOnMount={reconnectOnMount}>
      {children}
    </WagmiProvider>
  )
}
