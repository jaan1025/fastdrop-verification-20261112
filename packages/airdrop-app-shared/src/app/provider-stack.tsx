import type { ReactNode } from "react"
import { NuqsAdapter } from "nuqs/adapters/tanstack-router"
import { Toaster } from "@repo/ui/components/sonner"
import { TooltipProvider } from "@repo/ui/components/tooltip"
import { QueryProvider, AcsProvider } from "../providers/data"
import { EvmProvider, SolanaRootProvider } from "../providers/chains"
import { AuthSideEffects } from "./auth-side-effects"

export interface ProviderStackProps {
  children: ReactNode
  /**
   * Redirect target on session loss (e.g. `"/login"`); forwarded into the auth
   * side-effect gates this stack mounts. `ProviderStack` is the single home for
   * `loginRoute` — it is not threaded separately by each app.
   */
  loginRoute: string
  /**
   * EVM ToS dialog host, mounted INSIDE the wagmi tree (only the portal supplies
   * it; consoles omit so the native-crypto graph stays out of their bundles).
   */
  evmTosHost?: ReactNode
  /**
   * Solana ToS dialog host, mounted INSIDE the Solana wallet tree (kept separate
   * from EVM so neither host is ever stranded).
   */
  solanaTosHost?: ReactNode
}

/**
 * The named top-of-tree provider composition apps compose their own root from
 * (replaces the legacy `AppRoot` + `RootProviders` god pair). Sanctioned
 * both-chain file: the composition root legitimately names both ecosystems.
 *
 * AppKit is NOT initialized here — `createAppKit` must run at module scope,
 * before any render (see `providers/chains/init.ts`); each app shell calls
 * `ensureAppKit` as a top-level side effect.
 *
 * Order (outside-in) is deliberate:
 * - `NuqsAdapter` exposes the router to nuqs hooks. URL state is needed
 *   everywhere; keep it outermost.
 * - `QueryProvider` → `AcsProvider`: ACS hooks run through React Query, so the
 *   QueryClient must be in scope when the ACS provider mounts.
 * - `EvmProvider` (wagmi): independent of ACS, but cheap and synchronous — mount
 *   before Solana so EVM-only sub-trees don't pay Solana init cost.
 * - `SolanaRootProvider`: route-driven cluster reads from `useAppConf()`, so it
 *   must be inside `AcsProvider`.
 * - `TooltipProvider`: pure UI infra, innermost so it has the smallest re-render
 *   footprint and the largest reachable child tree.
 *
 * The auth side-effects (401 bridge + gates) mount inside the authed tree with
 * `loginRoute`. `NuqsAdapter` and `TooltipProvider` are intentionally inlined —
 * one-line, zero-config wrappers that don't earn their own files.
 */
export function ProviderStack({
  children,
  loginRoute,
  evmTosHost,
  solanaTosHost,
}: ProviderStackProps) {
  return (
    <NuqsAdapter>
      <QueryProvider>
        <AcsProvider>
          <EvmProvider tosHost={evmTosHost}>
            <SolanaRootProvider tosHost={solanaTosHost}>
              <TooltipProvider>
                {children}
                <Toaster />
                <AuthSideEffects loginRoute={loginRoute} />
              </TooltipProvider>
            </SolanaRootProvider>
          </EvmProvider>
        </AcsProvider>
      </QueryProvider>
    </NuqsAdapter>
  )
}
