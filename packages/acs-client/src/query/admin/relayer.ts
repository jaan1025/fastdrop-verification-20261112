import { skipToken, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { createRelayer, getRelayers, type CreateRelayerParams } from "../../actions/admin/relayer"
import { acsKeys } from "../keys"
import type { RelayerResponse } from "../../model"

export type AdminRelayersQueryKey = ReturnType<typeof acsKeys.admin.relayers>

export const relayersQueryOptions = (client: AcsClient) =>
  ({
    queryKey: acsKeys.admin.relayers(client.appId ?? ""),
    queryFn: client.appId ? () => getRelayers(client) : skipToken,
  }) satisfies UseQueryOptions<RelayerResponse[], Error, RelayerResponse[], AdminRelayersQueryKey>

export type CreateRelayerData = Awaited<ReturnType<typeof createRelayer>>

export const createRelayerMutationOptions = (client: AcsClient) =>
  ({
    mutationFn: (variables: CreateRelayerParams) => createRelayer(client, variables),
    mutationKey: [...acsKeys.admin.all(), "createRelayer"] as const,
  }) satisfies UseMutationOptions<CreateRelayerData, Error, CreateRelayerParams>
