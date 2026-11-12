import type { AcsClient } from "../../transport"
import { normalizeEvmAddress, type InspectResult } from "../../model"

export const inspectToken = (client: AcsClient, params: { handler: string }) =>
  client.request<InspectResult>(`/inspect/${normalizeEvmAddress(params.handler)}`)
