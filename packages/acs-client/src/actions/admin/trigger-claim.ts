import type { AcsClient } from "../../transport"
import { requireAppId, requireDeployment } from "../../transport"

export interface TriggerClaimParams {
  batch: string
  addressHandler: string
  extra: string
  /** Override the client's deploymentId for this call. */
  deploymentId?: string
}

export const triggerClaim = (client: AcsClient, params: TriggerClaimParams) => {
  const deployment = requireDeployment(client, params.deploymentId, "triggerClaim")
  return client.request<{ released: string; sig: `0x${string}` }>("/admin/trigger_claim", {
    method: "POST",
    body: {
      appId: requireAppId(client, "triggerClaim"),
      deployment,
      batch: params.batch,
      addressHandler: params.addressHandler,
      extra: params.extra,
    },
  })
}
