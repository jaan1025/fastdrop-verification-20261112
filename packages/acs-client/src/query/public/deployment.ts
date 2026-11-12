import { skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { getDeployment, type DeploymentResponse } from "../../actions/public/deployment"
import { acsKeys } from "../keys"

export type DeploymentQueryKey = ReturnType<typeof acsKeys.public.deployment>

export const deploymentQueryOptions = (client: AcsClient, params: { name: string }) =>
  ({
    queryKey: acsKeys.public.deployment({
      appId: client.appId ?? "",
      name: params.name,
    }),
    queryFn: client.appId ? () => getDeployment(client, params) : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  }) satisfies UseQueryOptions<DeploymentResponse, Error, DeploymentResponse, DeploymentQueryKey>
