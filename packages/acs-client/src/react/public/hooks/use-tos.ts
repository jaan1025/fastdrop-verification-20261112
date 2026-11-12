"use client"
import { useQuery } from "@tanstack/react-query"
import { tosQueryOptions, type ToSData, type ToSQueryKey } from "../../../query/public/tos"
import type { QueryParameter } from "../../types/query-parameter"
import { usePublicClient } from "../../use-acs-config"

export const useToS = <TData = ToSData>(
  parameters: QueryParameter<ToSData, Error, TData, ToSQueryKey> = {},
) => {
  const client = usePublicClient()
  return useQuery({
    ...tosQueryOptions(client),
    ...parameters.query,
  })
}
