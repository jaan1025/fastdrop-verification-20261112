import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type Hash } from "viem"
import { getUserAllocation } from "@repo/acs-client/actions"
import type { AcsClient } from "@repo/acs-client/transport"
import { type QueryParameter } from "@repo/acs-client/react"
import { computeMerkleRoot } from "@repo/airdrop-base/distributor"
import { toBigInt } from "@repo/shared/utils"
import { airdropEvmKeys } from "../keys"

export type EvmMerkleRootData = Hash | null
export type EvmMerkleRootQueryKey = ReturnType<typeof airdropEvmKeys.merkleRoot>

export const evmMerkleRootQueryOptions = (
  acsClient: AcsClient,
  params: {
    appId: string
    deployment: string
    chainId: number
    batch: string | undefined
    /** Merkle-leaf / allocation key (`addressHandler`) — the root is looked up
     * by the leaf, NOT the resolved claim recipient. The handler-hash is derived
     * from this (`computeMerkleRoot` re-hashes internally), so it is NOT a
     * separate param. */
    handler: Address | undefined
  },
) => {
  const { batch, handler } = params
  return queryOptions({
    queryKey: airdropEvmKeys.merkleRoot({
      appId: params.appId,
      deployment: params.deployment,
      batch,
      chainId: params.chainId,
      handler,
    }),
    queryFn:
      batch && handler
        ? async (): Promise<EvmMerkleRootData> => {
            const { allocation, addressHandler, extra } =
              (await getUserAllocation(acsClient, {
                batch,
                address: handler,
                deploymentId: params.deployment,
              })) ?? {}
            const proof = (extra?.proof ?? []) as Hash[]
            if (!proof.length || !allocation || !addressHandler) {
              return null
            }
            return computeMerkleRoot("evm", {
              proof,
              handler: addressHandler,
              amount: toBigInt(allocation),
            }) as Hash
          }
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export type UseMerkleRootParameters = {
  appId: string
  deployment: string
  batch: string | undefined
  chainId: number
  /** Merkle-leaf / allocation key (`addressHandler`). */
  handler: Address | undefined
} & QueryParameter<EvmMerkleRootData, Error, EvmMerkleRootData, EvmMerkleRootQueryKey>
