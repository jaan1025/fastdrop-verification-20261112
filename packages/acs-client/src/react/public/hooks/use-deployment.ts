"use client"
import { useQuery } from "@tanstack/react-query"
import { deploymentQueryOptions, type DeploymentQueryKey } from "../../../query/public/deployment"
import type { DeploymentResponse } from "../../../actions/public/deployment"
import type { QueryParameter } from "../../types/query-parameter"
import { usePublicClient } from "../../use-acs-config"

export type UseDeploymentParameters<TData = DeploymentResponse> = {
  name: string
} & QueryParameter<DeploymentResponse, Error, TData, DeploymentQueryKey>

export const useDeployment = <TData = DeploymentResponse>(
  parameters: UseDeploymentParameters<TData>,
) => {
  const client = usePublicClient()
  const { query, ...params } = parameters
  return useQuery({
    ...deploymentQueryOptions(client, params),
    ...query,
  })
}
