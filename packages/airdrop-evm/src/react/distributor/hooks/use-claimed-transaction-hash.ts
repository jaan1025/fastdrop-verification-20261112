"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmClaimedTransactionHashQueryOptions,
  type UseClaimedTransactionHashParameters,
} from "../../../query/distributor"
import { useConsumption } from "./use-consumption"

export const useClaimedTransactionHash = (parameters: UseClaimedTransactionHashParameters) => {
  const { query, ...params } = parameters
  const publicClient = usePublicClient({ chainId: params.chainId })

  const consumptionQuery = useConsumption({
    appId: params.appId,
    deployment: params.deployment,
    batch: params.batch,
    chainId: params.chainId,
    handler: params.handler,
    distributor: params.distributor,
  })

  return useQuery({
    ...evmClaimedTransactionHashQueryOptions({
      ...params,
      lastClaimedBlock: consumptionQuery.data?.lastClaimedBlock,
      publicClient,
    }),
    ...query,
  })
}
