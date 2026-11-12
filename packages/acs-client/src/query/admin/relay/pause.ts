import type { UseMutationOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../../transport"
import {
  pauseDistributor,
  unpauseDistributor,
  type PauseDistributorParams,
} from "../../../actions/admin/relay/pause"
import { acsKeys } from "../../keys"

export type PauseDistributorData = Awaited<ReturnType<typeof pauseDistributor>>

export const pauseDistributorMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: PauseDistributorParams) => pauseDistributor(client, variables),
    mutationKey: [...acsKeys.admin.all(), "pauseDistributor"] as const,
  }) satisfies UseMutationOptions<PauseDistributorData, Error, PauseDistributorParams>

export const unpauseDistributorMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: PauseDistributorParams) => unpauseDistributor(client, variables),
    mutationKey: [...acsKeys.admin.all(), "unpauseDistributor"] as const,
  }) satisfies UseMutationOptions<PauseDistributorData, Error, PauseDistributorParams>
