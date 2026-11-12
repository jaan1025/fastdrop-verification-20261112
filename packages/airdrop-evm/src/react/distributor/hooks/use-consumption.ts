"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmConsumptionQueryOptions,
  type UseConsumptionParameters,
} from "../../../query/distributor"
import { useMerkleRoot } from "./use-merkle-root"

export const useConsumption = (parameters: UseConsumptionParameters) => {
  const { query, ...params } = parameters
  const publicClient = usePublicClient({ chainId: params.chainId })

  const merkleRootQuery = useMerkleRoot({
    appId: params.appId,
    deployment: params.deployment,
    batch: params.batch,
    chainId: params.chainId,
    handler: params.handler,
  })

  const merkleRoot = merkleRootQuery.data ?? undefined

  return useQuery({
    ...evmConsumptionQueryOptions({ ...params, merkleRoot, publicClient }),
    ...query,
  })
}
