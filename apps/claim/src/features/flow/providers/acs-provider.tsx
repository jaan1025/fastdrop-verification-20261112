import { useMemo, type ReactNode } from "react"
import { AcsProvider as AcsClientProvider } from "@repo/acs-client/react"
import { createAcsConfig } from "@repo/acs-client/transport"

import { acsApiBaseUrl, appId } from "~/lib/env"

// Env-seeded ACS config provider (the claim portal is seeded from VITE_APP_ID +
// VITE_DEPLOYMENT, NOT route params). The shared @repo/airdrop-app-shared
// AcsProvider is route-scope-driven (`useRouteScope()` + an admin apiKey) and
// its Solana registry sync needs an admin client — neither of which a public
// claim portal has. So this app composes the SAME provider order app-locally
// (query → ACS → EVM → Solana) with a public, env-seeded ACS client — the exact
// pattern the registration app established. Flagged in the report.
//
// The public claim reads (deployment / allocations / claim co-sign) + the chain
// kit's ToS signer (`/tos_message/{appId}`) all resolve through this client. The
// JWT is read from the map-jwt vault so authenticated ACS reads carry it.
const readJwtFromVault = (): string | undefined => {
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.localStorage.getItem("map-jwt")
    if (!raw) return undefined
    const map = JSON.parse(raw) as Record<string, string>
    const first = Object.values(map)[0]
    return typeof first === "string" ? first : undefined
  } catch {
    return undefined
  }
}

export const AcsProvider = ({ children }: { children: ReactNode }) => {
  const config = useMemo(
    () =>
      createAcsConfig({
        baseUrl: acsApiBaseUrl(),
        appId: appId() || undefined,
        publicHeaders: {
          getAppId: () => appId() || undefined,
          getJwt: readJwtFromVault,
        },
      }),
    [],
  )

  return <AcsClientProvider config={config}>{children}</AcsClientProvider>
}
