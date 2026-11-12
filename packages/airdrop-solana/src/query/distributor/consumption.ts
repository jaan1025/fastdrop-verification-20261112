import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  getDistributorPDA,
  getClaimRootPDA,
  getClaimStatus,
} from "../../contracts/distributor/functions"
import { solanaHandlerBytes } from "../../contracts/distributor/functions/merkle"
import { hexToBytes } from "@repo/shared/utils"
import { airdropSolanaKeys } from "../keys"

/**
 * The allocation's on-chain consumption ledger. The wire account field is
 * `ClaimStatus.claimed`, but it records the CONSUMED allocation (= released at
 * the last claim), NOT what reached the wallet — decompose via the base
 * strategy model (`configurationClaimed`) into wallet-claimed / forfeited /
 * locked.
 */
export interface SolanaConsumption {
  /** Total allocation consumed on-chain (= released amount). */
  consumed: bigint
  /** Slot of the last claim tx. Its block time (the penalty curve's input) is
   * a SEPARATE query (`solanaClaimTimeQueryOptions`) — this result caches
   * forever, so a transiently-failed block-time read must not ride in it. */
  lastSlot: bigint
}

export type SolanaConsumptionData = SolanaConsumption | null
export type SolanaConsumptionQueryKey = ReturnType<typeof airdropSolanaKeys.consumption>

export const solanaConsumptionQueryOptions = (params: {
  chain: SolanaChain
  appId: string
  deployment: string
  batch: string | undefined
  base: Address | undefined
  root: `0x${string}` | undefined
  /** Merkle-leaf / allocation key (`addressHandler`) — the on-chain `consumed`
   * status is per-leaf, keyed by the handler, not the resolved recipient. */
  handler: string | undefined
  dynamicRecipient?: boolean
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, base, root, handler, dynamicRecipient } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.consumption({
      chain,
      appId: params.appId,
      deployment: params.deployment,
      batch: params.batch,
      base,
      root,
      handler,
      dynamicRecipient: dynamicRecipient || undefined,
    }),
    queryFn:
      rpc && base && root && handler
        ? async (): Promise<SolanaConsumptionData> => {
            const handlerBytes = solanaHandlerBytes(handler, dynamicRecipient)
            const rootBytes = hexToBytes(root)

            const [distributorPda] = await getDistributorPDA(base)
            const [claimRootPda] = await getClaimRootPDA({
              distributor: distributorPda,
              root: rootBytes,
            })

            const status = await getClaimStatus(rpc, {
              distributor: distributorPda,
              claimRoot: claimRootPda,
              handler: handlerBytes,
            })

            if (!status || status.claimed === 0n) return null

            return {
              consumed: status.claimed,
              lastSlot: status.lastSlot,
            }
          }
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
