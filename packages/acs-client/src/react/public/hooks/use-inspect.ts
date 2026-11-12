"use client"
import { useQuery } from "@tanstack/react-query"
import { inspectQueryOptions, type InspectQueryKey } from "../../../query/public/inspect"
import type { InspectResult } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { usePublicClient } from "../../use-acs-config"

export type UseInspectParameters<TData = InspectResult> = {
  handler?: string
} & QueryParameter<InspectResult, Error, TData, InspectQueryKey>

export const useInspect = <TData = InspectResult>(parameters: UseInspectParameters<TData>) => {
  const client = usePublicClient()
  const { query, ...params } = parameters
  return useQuery({
    ...inspectQueryOptions(client, params),
    ...query,
  })
}
