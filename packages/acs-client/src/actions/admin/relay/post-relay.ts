import type { AcsClient } from "../../../transport"
import { requireAppId, requireDeployment } from "../../../transport"

/**
 * The shared relay request envelope. Every `/admin/relay/*` action is a
 * deployment-scoped POST with the same body skeleton:
 *
 *   { appId, deployment, ...rest }   // rest = params minus `deploymentId`
 *
 * relayed on-chain by the backend (the browser never signs), returning the
 * resulting tx hash. The body key ORDER (`appId`, `deployment`, then the
 * spread remainder) is byte-critical — it is the JSON serialization order the
 * backend's relay endpoints consume.
 *
 * The default 120s timeout matches the relay path (on-chain confirmation is
 * slow); pause/unpause opt out by passing `timeoutMs: undefined`.
 */
export const postRelay = <TResult = { txHash: `0x${string}` }>(
  client: AcsClient,
  path: string,
  params: { deploymentId?: string },
  actionName: string,
  options: { timeoutMs?: number } = { timeoutMs: 120_000 },
): Promise<TResult> => {
  const deployment = requireDeployment(client, params.deploymentId, actionName)
  const { deploymentId: _deploymentId, ...rest } = params
  return client.request<TResult>(path, {
    method: "POST",
    body: { appId: requireAppId(client, actionName), deployment, ...rest },
    timeoutMs: options.timeoutMs,
  })
}
