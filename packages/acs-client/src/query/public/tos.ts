import { skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { getToSMessage } from "../../actions/public/tos"
import { acsKeys } from "../keys"
import { sha256Hex } from "../../model"

export interface ToSData {
  template: string
  content: string
  hash: `0x${string}`
}

export type ToSQueryKey = ReturnType<typeof acsKeys.public.tos>

export const tosQueryOptions = (client: AcsClient) =>
  ({
    queryKey: acsKeys.public.tos(client.appId ?? ""),
    queryFn: client.appId
      ? async (): Promise<ToSData> => {
          const res = await getToSMessage(client)
          const hash = await sha256Hex(res.tosMessage)
          return { template: res.tosTemplate, content: res.tosMessage, hash }
        }
      : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  }) satisfies UseQueryOptions<ToSData, Error, ToSData, ToSQueryKey>
