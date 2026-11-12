import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { createAppKit, type AppKit } from "@reown/appkit/react"
import type { AppKitNetwork } from "@reown/appkit/networks"
import { http, type Transport } from "viem"
import type { Config } from "wagmi"
import { isBrowser } from "@repo/shared/utils"
import { SUPPORTED_EVM_CHAINS, getViemChain } from "./supported-chains"

// All chains from SUPPORTED_EVM_CHAINS get registered with wagmi/AppKit. viem
// `Chain` is structurally compatible with `AppKitNetwork`. The wallet modal lets
// users connect on any registered chain; the project-create form drives which
// chains are *picker-eligible* via the same source list.
const buildNetworks = (): [AppKitNetwork, ...AppKitNetwork[]] => {
  const networks = SUPPORTED_EVM_CHAINS.map((c) => getViemChain(c.chainId)).filter(
    (n): n is NonNullable<typeof n> => n !== undefined,
  ) as AppKitNetwork[]
  return networks as [AppKitNetwork, ...AppKitNetwork[]]
}

const buildTransports = (): Record<number, Transport> =>
  Object.fromEntries(SUPPORTED_EVM_CHAINS.map((c) => [Number(c.chainId), http(c.rpcUrl)]))

export interface InitAppKitOptions {
  /** WalletConnect Cloud project ID. Apps must source this from their env. */
  projectId: string
  metadata?: {
    name: string
    description: string
    url?: string
    icons?: string[]
  }
  themeMode?: "dark" | "light"
  themeVariables?: Record<string, string | number>
  /**
   * AppKit feature flags (email, socials, swaps, onramp, ...). Pass-through to
   * `createAppKit`; the type is sourced from AppKit so it tracks the SDK. Stays
   * generic here — branded/product defaults are set by the consuming app.
   */
  features?: Parameters<typeof createAppKit>[0]["features"]
}

export interface AppKitInstance {
  modal: AppKit
  wagmiConfig: Config
}

// The globalThis cache is DEV/HMR-only: Vite module reloads must reuse the
// existing instance, else `createAppKit` re-registers already-defined custom
// elements and throws NotSupportedError. In prod the module-level singleton
// below is enough (modules are evaluated once), so the global is never touched.
interface AppKitGlobals {
  __cliqueAppKitModal?: AppKit
  __cliqueWagmiConfig?: Config
}
const devGlobals = globalThis as unknown as AppKitGlobals

const isDev = (): boolean =>
  Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV)

let instance: AppKitInstance | undefined

const construct = (options: InitAppKitOptions): AppKitInstance => {
  const networks = buildNetworks()

  const wagmiAdapter = new WagmiAdapter({
    projectId: options.projectId,
    networks,
    ssr: false,
    transports: buildTransports(),
  })

  const fallbackUrl = typeof window !== "undefined" ? window.location.origin : ""

  const modal = createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId: options.projectId,
    metadata: {
      name: options.metadata?.name ?? "Clique",
      description: options.metadata?.description ?? "Clique",
      url: options.metadata?.url ?? fallbackUrl,
      icons: options.metadata?.icons ?? [],
    },
    themeMode: options.themeMode,
    themeVariables: options.themeVariables,
    features: options.features,
  })

  return { modal, wagmiConfig: wagmiAdapter.wagmiConfig }
}

export const initAppKit = (options: InitAppKitOptions): AppKitInstance => {
  if (isDev() && devGlobals.__cliqueAppKitModal) {
    return {
      modal: devGlobals.__cliqueAppKitModal,
      wagmiConfig: devGlobals.__cliqueWagmiConfig!,
    }
  }
  if (instance) return instance

  instance = construct(options)

  if (isDev()) {
    devGlobals.__cliqueAppKitModal = instance.modal
    devGlobals.__cliqueWagmiConfig = instance.wagmiConfig
  }
  return instance
}

/**
 * SSR-safe, module-scope AppKit initializer for the app composition root.
 *
 * MUST be called at module scope of the app (a side effect at import time),
 * NEVER during a React render. `createAppKit` boots AppKit's controller state
 * machine and kicks off async session restore; running that inside a render
 * interleaves it with React mount/hydration and wagmi's own `reconnectOnMount`,
 * which corrupts AppKit's per-namespace network state. `createAppKit` also
 * registers custom elements that need a DOM, so this is a no-op on the server
 * (gated by `isBrowser`). Idempotent via `initAppKit`'s singleton, so a repeated
 * import or StrictMode double-invoke is safe. After this runs, `getWagmiConfig`
 * / `getAppKit` return the built instance.
 */
export const ensureAppKit = (options: InitAppKitOptions): void => {
  if (!isBrowser()) return
  initAppKit(options)
}

export const getAppKit = (): AppKit | undefined =>
  (isDev() ? devGlobals.__cliqueAppKitModal : undefined) ?? instance?.modal

export const getWagmiConfig = (): Config | undefined =>
  (isDev() ? devGlobals.__cliqueWagmiConfig : undefined) ?? instance?.wagmiConfig
