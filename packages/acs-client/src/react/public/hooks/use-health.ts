"use client"
import { useQuery } from "@tanstack/react-query"
import { healthQueryOptions, type HealthQueryKey } from "../../../query/public/health"
import type { HealthResponse } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { usePublicClient } from "../../use-acs-config"

export const useHealth = <TData = HealthResponse>(
  parameters: QueryParameter<HealthResponse, Error, TData, HealthQueryKey> = {},
) => {
  const client = usePublicClient()
  return useQuery({
    ...healthQueryOptions(client),
    ...parameters.query,
  })
}
