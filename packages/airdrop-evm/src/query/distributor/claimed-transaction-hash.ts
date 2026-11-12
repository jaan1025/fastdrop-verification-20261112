import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getClaimedTransactionHash } from "../../contracts/distributor/functions"
import { airdropEvmKeys } from "../keys"

export type EvmClaimedTransactionHashData = string
export type EvmClaimedTransactionHashQueryKey = ReturnType<
  typeof airdropEvmKeys.claimedTransactionHash
>

export const evmClaimedTransactionHashQueryOptions = (params: {
  appId: string
  deployment: string
  batch: string | undefined
  chainId: number
  /** Resolved claimer (`onBehalfOf`) — the `AirdropClaimed(account,…)` event is
   * emitted with `account = onBehalfOf`, so the tx-hash log filter keys by it. */
  recipient: Address | undefined
  distributor: Address | undefined
  lastClaimedBlock: bigint | undefined
  publicClient: PublicClient | undefined
}) => {
  const { publicClient, lastClaimedBlock, distributor, recipient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.claimedTransactionHash({
      appId: params.appId,
      deployment: params.deployment,
      batch: params.batch,
      chainId: params.chainId,
      recipient,
      distributor,
    }),
    queryFn:
      publicClient && lastClaimedBlock && distributor && recipient
        ? (): Promise<EvmClaimedTransactionHashData> =>
            getClaimedTransactionHash(publicClient, {
              distributor,
              recipient,
              blockNumber: lastClaimedBlock,
            })
        : skipToken,
  })
}

export type UseClaimedTransactionHashParameters = {
  appId: string
  deployment: string
  batch: string | undefined
  chainId: number
  /** Merkle-leaf / allocation key (`addressHandler`) — for the claim-status
   * (`claimed[root][handlerHash]`) read that yields `lastClaimedBlock`. */
  handler: Address | undefined
  /** Resolved claimer (`onBehalfOf`) — for the `AirdropClaimed` event filter. */
  recipient: Address | undefined
  distributor: Address | undefined
} & QueryParameter<
  EvmClaimedTransactionHashData,
  Error,
  EvmClaimedTransactionHashData,
  EvmClaimedTransactionHashQueryKey
>
