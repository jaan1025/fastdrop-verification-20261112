import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import { normalizeEvmAddress, type Allocation } from "../../model"

export interface GetAllUserAllocationsParams {
  address: string
  isBoundAddress?: boolean
  /**
   * ToS signature, required only for **gated** apps (`AppConf.gated === true`),
   * which also need a `deploymentId` for the backend's TOS check. Non-gated apps
   * ignore both.
   */
  sig?: string
  /** Required by the backend's gated-app TOS check only. App-wide reads omit it. */
  deploymentId?: string
}

/**
 * Public endpoint, **app-wide** variant: the calling user's allocations across
 * every batch in the app, with no deployment scoping. Returns the flat
 * `Allocation[]` (the portal groups by deployment itself). The `deployment`
 * field is `Option` server-side and used only for the gated-app TOS-sig check.
 */
export const getAllUserAllocations = async (
  client: AcsClient,
  params: GetAllUserAllocationsParams,
): Promise<Allocation[]> => {
  const res = await client.request<{ data: Allocation[] }>("/allocations", {
    method: "POST",
    body: {
      appId: requireAppId(client, "getAllUserAllocations"),
      // Omitted for non-gated apps (the common case). Gated apps pass it
      // alongside `sig` for the backend's TOS check.
      deployment: params.deploymentId,
      address: normalizeEvmAddress(params.address),
      isBoundAddress: params.isBoundAddress,
      sig: params.sig,
    },
  })
  return res.data ?? []
}
