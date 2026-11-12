import { type Address } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import {
  getDistributorPDA,
  getClaimRootPDA,
  getClaimStatusPDA,
} from "../../contracts/distributor/functions"
import { solanaHandlerBytes } from "../../contracts/distributor/functions/merkle"
import { hexToBytes } from "@repo/shared/utils"
import { airdropSolanaKeys } from "../keys"

export type SolanaClaimStatusPdaData = Address
export type SolanaClaimStatusPdaQueryKey = ReturnType<typeof airdropSolanaKeys.claimStatusPda>

export const solanaClaimStatusPdaQueryOptions = (params: {
  base: Address | undefined
  root: `0x${string}` | undefined
  /** Merkle-leaf / allocation key (`addressHandler`). */
  handler: string | undefined
}) => {
  const { base, root, handler } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.claimStatusPda({ base, root, handler }),
    queryFn:
      base && root && handler
        ? async (): Promise<SolanaClaimStatusPdaData> => {
            const handlerBytes = solanaHandlerBytes(handler)
            const rootBytes = hexToBytes(root)
            const [distributorPda] = await getDistributorPDA(base)
            const [claimRootPda] = await getClaimRootPDA({
              distributor: distributorPda,
              root: rootBytes,
            })
            const [claimStatusPda] = await getClaimStatusPDA({
              distributor: distributorPda,
              claimRoot: claimRootPda,
              handler: handlerBytes,
            })
            return claimStatusPda
          }
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
