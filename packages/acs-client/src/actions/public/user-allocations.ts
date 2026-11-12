import type { AcsClient } from "../../transport"
import { requireAppId, requireDeployment } from "../../transport"
import { normalizeEvmAddress, type Allocation } from "../../model"

export interface GetUserAllocationsParams {
  address: string
  isBoundAddress?: boolean
  sig?: string
  /** Override the client's deploymentId for this call. */
  deploymentId?: string
}

/**
 * Public endpoint: returns the calling user's allocations across every batch
 * they're in (one row per batch). Includes the merkle proof in `extra.proof` so
 * the wallet can construct a valid on-chain claim. Backend: `handle_allocations`
 * at `/allocations`.
 */
export const getUserAllocations = async (
  client: AcsClient,
  params: GetUserAllocationsParams,
): Promise<Allocation[]> => {
  const deployment = requireDeployment(client, params.deploymentId, "getUserAllocations")
  const res = await client.request<{ data: Allocation[] }>("/allocations", {
    method: "POST",
    body: {
      appId: requireAppId(client, "getUserAllocations"),
      deployment,
      address: normalizeEvmAddress(params.address),
      isBoundAddress: params.isBoundAddress,
      sig: params.sig,
    },
  })
  return res.data ?? []
}

export interface GetUserAllocationParams extends GetUserAllocationsParams {
  batch: string
}

/**
 * Convenience wrapper around `getUserAllocations` that filters to a single batch.
 * Backend has no per-batch endpoint — this fetches the full list and picks one.
 */
export const getUserAllocation = async (
  client: AcsClient,
  params: GetUserAllocationParams,
): Promise<Allocation | null> => {
  const { batch, ...rest } = params
  const allocations = await getUserAllocations(client, rest)
  return allocations.find((item) => item.batch === batch) ?? null
}
