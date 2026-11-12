import { skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { inspectToken } from "../../actions/public/inspect"
import { acsKeys } from "../keys"
import { normalizeEvmAddress } from "../../model"
import type { InspectResult } from "../../model"

export type InspectQueryKey = ReturnType<typeof acsKeys.public.inspect>

export const inspectQueryOptions = (client: AcsClient, params: { handler?: string }) => {
  const handler = normalizeEvmAddress(params.handler)
  return {
    queryKey: acsKeys.public.inspect(handler),
    queryFn: handler ? () => inspectToken(client, { handler }) : skipToken,
  } satisfies UseQueryOptions<InspectResult, Error, InspectResult, InspectQueryKey>
}
