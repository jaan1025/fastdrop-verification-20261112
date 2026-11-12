import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import type { RoleKey } from "../../model"

export interface DeploymentResponse {
  chainId: string
  roles: Partial<Record<RoleKey, string>>
}

export const getDeployment = (client: AcsClient, params: { name: string }) =>
  client.request<DeploymentResponse>("/deployment", {
    method: "POST",
    body: { appId: requireAppId(client, "getDeployment"), name: params.name },
  })
