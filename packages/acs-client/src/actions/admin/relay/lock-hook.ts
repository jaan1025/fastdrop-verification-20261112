import type { AcsClient } from "../../../transport"
import { postRelay } from "./post-relay"

export interface DeployLockHookParams {
  deployer: string
  deploymentId?: string
}

export const deployLockHook = (client: AcsClient, params: DeployLockHookParams) =>
  postRelay<{ txHash: `0x${string}` }>(
    client,
    "/admin/relay/cliquelock-hook/deploy",
    params,
    "deployLockHook",
  )

export interface SetPresetParams {
  deployer: string
  preset: string
  startTime: string
  cliffDuration: string
  vestingDuration: string
  startUnlockPercentage: string
  cliffUnlockPercentage: string
  pieceDuration: string
  isFixedStart: boolean
  lock: string
  deploymentId?: string
}

export const setPreset = (client: AcsClient, params: SetPresetParams) =>
  postRelay<{ txHash: string }>(
    client,
    "/admin/relay/cliquelock-hook/set-preset",
    params,
    "setPreset",
  )
