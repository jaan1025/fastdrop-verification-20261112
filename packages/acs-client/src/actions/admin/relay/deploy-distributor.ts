import type { AcsClient } from "../../../transport"
import { postRelay } from "./post-relay"

export interface DeployDistributorParams {
  projectAdmin: string
  deployer: string
  signer: string
  token: string
  vault: string
  /**
   * Backend-required boolean (always `false`). Sent as bool, not string — the
   * Rust struct deserializes `bool`.
   */
  dynamicRecipient: boolean
  isWrappedToken?: boolean
  /** Override the client's deploymentId for this call. */
  deploymentId?: string
}

export const deployDistributor = (client: AcsClient, params: DeployDistributorParams) =>
  postRelay<{ txHash: `0x${string}` }>(
    client,
    "/admin/relay/distributor/deploy",
    params,
    "deployDistributor",
  )
