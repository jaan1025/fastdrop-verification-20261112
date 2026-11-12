import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useAppConf } from "@repo/acs-client/react"
import { useApiKey } from "@repo/auth"
import {
  SolanaProvider as SolanaProviderUpstream,
  SolanaClientsProvider,
  type SolanaClientEntry,
  type SolanaProviderConfig,
} from "@repo/chain-solana-kit/react"
import { deploymentToSolanaConfig, deploymentsToSolanaEntries } from "./solana-provider-config"

// The wallet tree's config. Cluster/rpc are irrelevant to wallet state — rpc/ws
// now live in the global `SolanaClientsProvider`, resolved by chainId. Kept as a
// static default until the wallet provider is slimmed to wallet-only.
const DEFAULT_MAINNET_CONFIG: SolanaProviderConfig = deploymentToSolanaConfig(undefined)

export interface SolanaRootProviderProps {
  children: ReactNode
  /**
   * Injected Solana ToS dialog host (`<SolanaTosHost/>`), mounted inside the
   * Solana wallet tree so its `useSolana` / `useSignMessage` hooks resolve.
   * Passed as a slot so the admin consoles keep it out of their bundles; the
   * portal injects it (a Solana first-claim's `ensureToSSigned()` hangs without it).
   */
  tosHost?: ReactNode
}

/**
 * Root Solana provider.
 *
 * Two decoupled concerns, no longer conflated:
 * - **Wallet** — `SolanaProviderUpstream` mounts ONCE, unconditionally, and owns
 *   only wallet state (connect/selected account). It never re-mounts on
 *   navigation, so a connected wallet survives every route/cluster change.
 * - **RPC/ws** — `SolanaClientsProvider` holds the global `chainId → {rpc,ws,chain}`
 *   registry (the Solana mirror of wagmi's transport map). Reads call
 *   `useSolanaClients(chainId)`; there is no route-driven config swap and no
 *   per-subtree provider.
 *
 * The registry is seeded from `appConf.deployments` (via `SolanaEntriesSync`,
 * mounted only post-auth since `useAppConf` needs the admin client) plus the
 * mainnet env entry, so mainnet reads work pre-appConf.
 */
export function SolanaRootProvider({ children, tosHost }: SolanaRootProviderProps) {
  const apiKey = useApiKey()
  const [entries, setEntries] = useState<SolanaClientEntry[]>(() =>
    deploymentsToSolanaEntries(undefined),
  )

  return (
    <SolanaProviderUpstream config={DEFAULT_MAINNET_CONFIG}>
      {apiKey ? <SolanaEntriesSync onEntries={setEntries} /> : null}
      <SolanaClientsProvider entries={entries}>
        {children}
        {tosHost}
      </SolanaClientsProvider>
    </SolanaProviderUpstream>
  )
}

/**
 * Reads appConf and lifts the derived Solana client entries to the parent so the
 * global registry tracks every deployment's endpoint. Render-less; mounted only
 * when an admin client is configured (post-auth). Replaces the old route-driven
 * `ProjectClusterSync` — the registry is keyed by chainId, not the active route.
 */
function SolanaEntriesSync({ onEntries }: { onEntries: (entries: SolanaClientEntry[]) => void }) {
  const appConfQuery = useAppConf()
  const entries = useMemo(() => deploymentsToSolanaEntries(appConfQuery.data), [appConfQuery.data])
  useEffect(() => {
    onEntries(entries)
  }, [entries, onEntries])
  return null
}
