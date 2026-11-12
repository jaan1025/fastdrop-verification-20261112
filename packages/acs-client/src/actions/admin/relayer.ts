import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import type { RelayerResponse } from "../../model"

export const getRelayers = (client: AcsClient) =>
  client.request<RelayerResponse[]>(`/admin/relayer/${requireAppId(client, "getRelayers")}`)

export interface CreateRelayerParams {
  chainId: string
  online?: boolean
}

export const createRelayer = (client: AcsClient, params: CreateRelayerParams) =>
  client.request<Pick<RelayerResponse, "address" | "chainId">>("/admin/relayer/create", {
    method: "POST",
    body: {
      appId: requireAppId(client, "createRelayer"),
      online: false,
      ...params,
    },
  })
