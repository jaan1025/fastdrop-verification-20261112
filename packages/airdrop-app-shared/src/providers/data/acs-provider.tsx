import { useMemo, type ReactNode } from "react"
import { createAcsConfig } from "@repo/acs-client/transport"
import { toWireScope } from "@repo/acs-client/model"
import { AcsProvider as AcsProviderUpstream } from "@repo/acs-client/react"
import { useApiKey } from "@repo/auth"
import { useApiBaseUrl } from "../../lib/base-url"
import { useRouteScope } from "../use-route-scope"

/**
 * Wires the ACS API client to the current route + auth state.
 *
 * The wire format uses `appId` / `deploymentId`; the UI's organization/project
 * vocabulary crosses into it here — and ONLY here — through the single typed
 * helper `toWireScope` (never restated inline). `appId` stays `undefined` (not
 * coerced to `""`) for bootstrap flows so app-scoped actions fail fast.
 */
export function AcsProvider({ children }: { children: ReactNode }) {
  const apiBaseUrl = useApiBaseUrl()
  const apiKey = useApiKey()
  const { organizationId, projectId } = useRouteScope()

  const config = useMemo(() => {
    const { appId, deploymentId } = organizationId
      ? toWireScope({ organizationId, projectId })
      : { appId: undefined, deploymentId: projectId }
    return createAcsConfig({
      baseUrl: apiBaseUrl,
      appId,
      deploymentId,
      admin: apiKey ? { apiKey } : undefined,
    })
  }, [apiBaseUrl, organizationId, projectId, apiKey])

  return <AcsProviderUpstream config={config}>{children}</AcsProviderUpstream>
}
