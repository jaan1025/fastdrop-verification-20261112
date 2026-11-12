import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type Hash, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { deriveHandlerHash } from "@repo/airdrop-base/distributor"
import { getConsumption } from "../../contracts/distributor/functions"
import { airdropEvmKeys } from "../keys"

export interface EvmConsumption {
  /** Cumulative CONSUMED allocation (= `released` at the last claim). */
  consumed: bigint
  lastClaimedBlock: bigint
  /** Block time of the last claim — the penalty curve's time input. Undefined
   * when nothing was consumed or the block read failed. */
  claimAtUnix: bigint | undefined
}

export type EvmConsumptionData = EvmConsumption | null
export type EvmConsumptionQueryKey = ReturnType<typeof airdropEvmKeys.consumption>

/**
 * The allocation's consumption ledger (`claimed[root][handlerHash]` on-chain —
 * a misnamed CONSUMED record, not wallet receipt; see `getConsumption`),
 * enriched with the last claim's block time so the base strategy attribution
 * (`configurationClaimed`) can replay the penalty curve at the claim instant.
 */
export const evmConsumptionQueryOptions = (params: {
  appId: string
  deployment: string
  chainId: number
  batch: string | undefined
  /** Merkle-leaf / allocation key (`addressHandler`) — the claim ledger is
   * `claimed[root][handlerHash]`, a per-leaf record. The handler-hash is derived
   * from this (`keccak`), so it is NOT a separate param. */
  handler: string | undefined
  dynamicRecipient?: boolean
  distributor: Address | undefined
  merkleRoot: Hash | undefined
  publicClient: PublicClient | undefined
}) => {
  const { publicClient, merkleRoot, distributor, handler, dynamicRecipient } = params
  const handlerHash = handler ? deriveHandlerHash(handler, dynamicRecipient) : undefined
  return queryOptions({
    queryKey: airdropEvmKeys.consumption({
      appId: params.appId,
      deployment: params.deployment,
      batch: params.batch,
      chainId: params.chainId,
      merkleRoot,
      handler,
      dynamicRecipient: dynamicRecipient || undefined,
      distributor,
    }),
    queryFn:
      publicClient && merkleRoot && distributor && handlerHash
        ? async (): Promise<EvmConsumptionData> => {
            const info = await getConsumption(publicClient, {
              distributor,
              root: merkleRoot,
              handlerHash,
            })
            if (!info) return null
            const claimAtUnix =
              info.consumed > 0n
                ? await publicClient
                    .getBlock({ blockNumber: info.lastClaimedBlock })
                    .then((block) => block.timestamp)
                    .catch(() => undefined)
                : undefined
            return { ...info, claimAtUnix }
          }
        : skipToken,
  })
}

export type UseConsumptionParameters = {
  appId: string
  deployment: string
  batch: string | undefined
  chainId: number
  /** Merkle-leaf / allocation key (`addressHandler`) — the handler-hash is
   * derived from this internally. */
  handler: Address | undefined
  distributor: Address | undefined
} & QueryParameter<EvmConsumptionData, Error, EvmConsumptionData, EvmConsumptionQueryKey>
