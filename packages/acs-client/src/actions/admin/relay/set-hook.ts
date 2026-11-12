import type { AcsClient } from "../../../transport"
import { postRelay } from "./post-relay"

export interface SetHookParams {
  hookName: string
  projectAdmin: string
  strategy: { hook: string; proportion: string }[]
  fallbackIdx: string
  deploymentId?: string
}

export const setHook = (client: AcsClient, params: SetHookParams) =>
  postRelay<{ txHash: `0x${string}` }>(
    client,
    "/admin/relay/distributor/set-hook",
    params,
    "setHook",
  )
