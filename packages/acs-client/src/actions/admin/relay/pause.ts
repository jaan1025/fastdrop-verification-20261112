import type { AcsClient } from "../../../transport"
import { postRelay } from "./post-relay"

export interface PauseDistributorParams {
  projectAdmin: string
  deploymentId?: string
}

// Pause/unpause are the relay group's only synchronous ops — they don't wait
// on a slow on-chain confirmation, so they opt out of the 120s relay timeout.
export const pauseDistributor = (client: AcsClient, params: PauseDistributorParams) =>
  postRelay<{ txHash: `0x${string}` }>(
    client,
    "/admin/relay/distributor/pause",
    params,
    "pauseDistributor",
    { timeoutMs: undefined },
  )

export const unpauseDistributor = (client: AcsClient, params: PauseDistributorParams) =>
  postRelay<{ txHash: `0x${string}` }>(
    client,
    "/admin/relay/distributor/unpause",
    params,
    "unpauseDistributor",
    { timeoutMs: undefined },
  )
