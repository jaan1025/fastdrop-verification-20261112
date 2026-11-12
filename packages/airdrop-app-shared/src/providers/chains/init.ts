import { initAppKit } from "@repo/chain-evm-kit/config"
import { isBrowser } from "@repo/shared/utils"
import { runtimeEnv } from "../../env"

export type WalletMetadata = { name: string; description: string }

let initialized = false

// Idempotent AppKit initializer. The metadata (app name / description) is
// supplied by the consuming app so this runtime stays app-agnostic; every other
// option is fixed here.
//
// MUST be called at module scope of the app shell (a side effect at import
// time), never during a React render. `createAppKit` boots AppKit's controller
// state machine and kicks off async session restore; running that inside a
// render interleaves it with React mount/hydration and wagmi's own
// `reconnectOnMount`, which corrupts AppKit's per-namespace network state
// (connector `getChainId()` → undefined, WC proposals carrying no active
// network). Server-side `createAppKit` would fail because it registers custom
// elements that need a DOM, so we gate by `isBrowser` — calling this on
// the server is a safe no-op.
export function ensureAppKit(metadata: WalletMetadata) {
  if (initialized) return
  if (!isBrowser()) return
  initAppKit({
    projectId: runtimeEnv.walletConnectProjectId,
    metadata,
    // Theme the AppKit (EVM) connect modal to the Clique design system. The
    // products are light-only (no dark toggle), so the mode is fixed. Every
    // value references a packages/ui token via `var(...)`: CSS custom properties
    // inherit across AppKit's shadow DOM and resolve at paint, so there is no
    // hex drift from the token source and no init-timing concern. (AppKit
    // consumes `--apkt-accent` internally rather than re-exposing it as a
    // readable property, but the value still resolves — verified live: the
    // accent paints `--primary`.)
    themeMode: "light",
    themeVariables: {
      "--apkt-accent": "var(--primary)",
      "--apkt-border-radius-master": "0px",
      "--apkt-font-family": "var(--font-sans)",
    },
    // Wallet-first product: drop AppKit's email + social login block.
    features: { email: false, socials: false },
  })
  initialized = true
}
