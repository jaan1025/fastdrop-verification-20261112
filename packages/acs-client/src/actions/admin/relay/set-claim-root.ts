import type { AcsClient } from "../../../transport"
import { postRelay } from "./post-relay"

export interface SetClaimRootParams {
  projectAdmin: string
  root: `0x${string}`
  /**
   * Each item is a bytes32 hex of `keccak256(toBytes(code))` for one
   * colon-delimited piece of the schedule configuration. Empty array clears the
   * root (revoke). Backend (`SetBatchRequest.configuration`) is `Vec<String>`
   * parsed via `FixedBytes::<32>::from_hex`.
   */
  configuration: `0x${string}`[]
  deploymentId?: string
}

export const setClaimRoot = (client: AcsClient, params: SetClaimRootParams) =>
  postRelay<{ txHash: `0x${string}` }>(
    client,
    "/admin/relay/distributor/set-claim-root",
    params,
    "setClaimRoot",
  )
