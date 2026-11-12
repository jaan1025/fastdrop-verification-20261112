import type { AcsClient } from "../../../transport"
import { postRelay } from "./post-relay"

export interface DeployTransferHookParams {
  deployer: string
  deploymentId?: string
}

export const deployTransferHook = (client: AcsClient, params: DeployTransferHookParams) =>
  postRelay<{ txHash: `0x${string}` }>(
    client,
    "/admin/relay/transfer-hook/deploy",
    params,
    "deployTransferHook",
  )
