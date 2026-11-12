import type { AcsClient } from "../../transport"
import { requireAppId } from "../../transport"
import type { ToSResponse } from "../../model"

export const getToSMessage = (client: AcsClient) =>
  client.request<ToSResponse>(`/tos_message/${requireAppId(client, "getToSMessage")}`)
