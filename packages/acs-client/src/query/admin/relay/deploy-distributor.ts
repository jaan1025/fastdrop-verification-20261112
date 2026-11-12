import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../../transport"
import {
  deployDistributor,
  type DeployDistributorParams,
} from "../../../actions/admin/relay/deploy-distributor"
import { acsKeys } from "../../keys"

export type DeployDistributorData = Awaited<ReturnType<typeof deployDistributor>>

export const deployDistributorMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: DeployDistributorParams) => deployDistributor(client, variables),
    mutationKey: [...acsKeys.admin.all(), "deployDistributor"] as const,
  }) satisfies UseMutationOptions<DeployDistributorData, Error, DeployDistributorParams>
