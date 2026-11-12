import { skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { getUserAllocations } from "../../actions/public/user-allocations"
import { acsKeys } from "../keys"
import type { Allocation } from "../../model"
import { normalizeEvmAddress } from "../../model"

/**
 * Transformed view of a user's allocations:
 * - `byBatch` — quick lookup by batch id
 * - `batches` — ordered list of batch ids the user is in
 * - `totalAllocation` — sum of all `allocation` strings as a bigint
 */
export interface UserAllocations {
  byBatch: Record<string, Allocation>
  batches: string[]
  totalAllocation: bigint
}

export type UserAllocationsQueryKey = ReturnType<typeof acsKeys.public.userAllocations>

export const userAllocationsQueryOptions = (
  client: AcsClient,
  params: {
    address: string | undefined
    isBoundAddress?: boolean
    sig?: string
    deploymentId?: string
  },
) => {
  const address = normalizeEvmAddress(params.address)
  const deployment = params.deploymentId ?? client.deploymentId
  return {
    queryKey: acsKeys.public.userAllocations({
      appId: client.appId ?? "",
      deployment: deployment ?? "",
      address,
    }),
    queryFn:
      address && deployment
        ? async (): Promise<UserAllocations> => {
            const data =
              (await getUserAllocations(client, {
                address,
                isBoundAddress: params.isBoundAddress,
                sig: params.sig,
                deploymentId: deployment,
              })) || []

            const totalAllocation = data.reduce(
              (acc, res) => acc + BigInt(res?.allocation ?? "0"),
              BigInt(0),
            )

            const batches = data.map((item) => item.batch)

            return {
              byBatch: data.reduce(
                (acc, item) => {
                  acc[item.batch] = item
                  return acc
                },
                {} as Record<string, Allocation>,
              ),
              batches,
              totalAllocation,
            }
          }
        : skipToken,
    staleTime: 1000 * 60,
  } satisfies UseQueryOptions<UserAllocations, Error, UserAllocations, UserAllocationsQueryKey>
}
