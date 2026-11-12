import type { AcsClient } from "../../../transport"
import { postRelay } from "./post-relay"
import type { LinearPenaltyHookStrategy } from "../../../model"

export interface DeployPenaltyHookParams {
  deployer: string
  deploymentId?: string
}

export const deployPenaltyHook = (client: AcsClient, params: DeployPenaltyHookParams) =>
  postRelay<{ txHash: `0x${string}` }>(
    client,
    "/admin/relay/linear-penalty-hook/deploy",
    params,
    "deployPenaltyHook",
  )

export interface SetPenaltyConfigParams {
  projectAdmin: string
  configurationId: string
  penaltyConfig: LinearPenaltyHookStrategy["penaltyConfig"]
  deploymentId?: string
}

export const setPenaltyConfig = (client: AcsClient, params: SetPenaltyConfigParams) =>
  postRelay<{ txHash: string }>(
    client,
    "/admin/relay/linear-penalty-hook/set-penalty-config",
    params,
    "setPenaltyConfig",
  )
