import { useEffect, useState, type ReactNode } from "react"
import { WagmiProvider as WagmiProviderUpstream } from "wagmi"
import { getWagmiConfig } from "@repo/chain-evm-kit/config"

export interface EvmProviderProps {
  children: ReactNode
  /**
   * Injected EVM ToS dialog host (`<EvmTosHost/>`) mounted inside the wagmi tree
   * so its `useSignMessage` hooks resolve. Passed as a slot — rather than
   * importing the host here behind a flag — so its native-crypto graph stays out
   * of the bundle for apps (the consoles) that omit it. The portal supplies it.
   */
  tosHost?: ReactNode
}

/**
 * Wagmi host with a mount boundary.
 *
 * AppKit-backed wagmi config can only be constructed on the client (it reads
 * `window`), so we defer to a post-mount effect. The first paint matches the
 * SSR shell (no provider); the next paint mounts with config. We render
 * `null` in the gap so descendants can call wagmi hooks unconditionally
 * without "is wagmi ready" checks scattered across consumers.
 *
 * All supported EVM chains are baked into the config at init via
 * `buildTransports()` — no per-chain provider scoping needed; consumers pass
 * `chainId` per call and wagmi picks the right transport.
 */
export function EvmProvider({ children, tosHost }: EvmProviderProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const config = mounted ? getWagmiConfig() : undefined
  if (!config) return null

  return (
    <WagmiProviderUpstream config={config}>
      {children}
      {tosHost}
    </WagmiProviderUpstream>
  )
}
