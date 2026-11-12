import { skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { AcsClient } from "../../transport"
import { getAllUserAllocations } from "../../actions/public/all-user-allocations"
import { acsKeys } from "../keys"
import type { Allocation } from "../../model"
import { normalizeEvmAddress } from "../../model"

export type AllUserAllocationsQueryKey = ReturnType<typeof acsKeys.public.allUserAllocations>

/**
 * App-wide allocations query. Unlike `userAllocationsQueryOptions`, this is NOT
 * deployment-scoped: it keys off `{ appId, address }` only and returns the flat
 * `Allocation[]` (the portfolio groups by deployment itself). The fetch gates on
 * `address` alone — no deployment is required (the backend treats it as
 * `Option` for non-gated apps).
 */
export const allUserAllocationsQueryOptions = (
  client: AcsClient,
  params: {
    address: string | undefined
    isBoundAddress?: boolean
    sig?: string
    deploymentId?: string
  },
) => {
  const address = normalizeEvmAddress(params.address)
  return {
    queryKey: acsKeys.public.allUserAllocations({
      appId: client.appId ?? "",
      address,
    }),
    queryFn: address
      ? (): Promise<Allocation[]> =>
          getAllUserAllocations(client, {
            address,
            isBoundAddress: params.isBoundAddress,
            sig: params.sig,
            deploymentId: params.deploymentId,
          })
      : skipToken,
    staleTime: 1000 * 60,
  } satisfies UseQueryOptions<Allocation[], Error, Allocation[], AllUserAllocationsQueryKey>
}
