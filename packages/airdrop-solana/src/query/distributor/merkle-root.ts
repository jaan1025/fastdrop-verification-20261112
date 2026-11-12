import { type Address } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import { getUserAllocation } from "@repo/acs-client/actions"
import type { AcsClient } from "@repo/acs-client/transport"
import { toBigInt } from "@repo/shared/utils"
import { computeSolanaRoot } from "../../contracts/distributor/functions/merkle"
import { airdropSolanaKeys } from "../keys"

export type SolanaMerkleRootData = `0x${string}` | null
export type SolanaMerkleRootQueryKey = ReturnType<typeof airdropSolanaKeys.merkleRoot>

export const solanaMerkleRootQueryOptions = (
  acsClient: AcsClient,
  params: {
    appId: string
    deployment: string
    batch: string | undefined
    /** Merkle-leaf / allocation key (`addressHandler`) — the root is looked up
     * by the leaf, NOT the resolved claim recipient. */
    handler: Address | undefined
  },
) => {
  const { batch, handler } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.merkleRoot({
      appId: params.appId,
      deployment: params.deployment,
      batch,
      handler: handler as string,
    }),
    queryFn:
      batch && handler
        ? async (): Promise<SolanaMerkleRootData> => {
            const batchData = await getUserAllocation(acsClient, {
              batch,
              address: handler as string,
              deploymentId: params.deployment,
            })

            const { allocation, addressHandler } = batchData || {}
            const proof = (batchData?.extra?.proof || []) as `0x${string}`[]

            if (!proof?.length || !allocation) return null
            if (!addressHandler) return null

            return computeSolanaRoot({
              proof,
              handler: addressHandler,
              amount: toBigInt(allocation),
            })
          }
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
