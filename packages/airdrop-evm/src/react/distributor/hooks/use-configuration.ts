"use client"
import { useQuery } from "@tanstack/react-query"
import { usePublicClient } from "wagmi"
import {
  evmConfigurationQueryOptions,
  type UseConfigurationParameters,
} from "../../../query/distributor"
import { useMerkleRoot } from "./use-merkle-root"

export const useConfiguration = (parameters: UseConfigurationParameters) => {
  const { query, appId, deployment, batch, handler, ...params } = parameters
  const publicClient = usePublicClient({ chainId: params.chainId })

  const merkleRootQuery = useMerkleRoot({
    appId,
    deployment,
    batch,
    chainId: params.chainId,
    handler,
  })

  const merkleRoot = merkleRootQuery.data ?? undefined

  return useQuery({
    ...evmConfigurationQueryOptions({
      ...params,
      merkleRoot,
      publicClient,
    }),
    ...query,
  })
}
