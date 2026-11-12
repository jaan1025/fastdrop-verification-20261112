import { skipToken, useQuery } from "@tanstack/react-query"
import { isEvmAddress, normalizeEvmAddress } from "@repo/acs-client/model"
import { useLockClaimPortalEvm } from "@repo/airdrop-app-shared/claim/hooks/lock-claim-portal-evm"
import { useEvmPublicClient } from "@repo/chain-evm-kit/react"
import {
  distributorAbi,
  getConfigurationIds,
  getStreamId,
  getStreamPreset,
  lockAbi,
} from "@repo/airdrop-evm/contracts"
import { useClaimableAmount, useStream } from "@repo/airdrop-evm/react"

import type { CampaignRoot } from "../../live-claim"
import type { ClaimContext } from "../../hooks/use-claim-context"
import type { ArmConsumption, ArmLock } from "../claim-arm-context"

const AIRDROP_CLAIMED = distributorAbi.find(
  (item) => item.type === "event" && item.name === "AirdropClaimed",
)!
const STREAM_CREATED = lockAbi.find(
  (item) => item.type === "event" && item.name === "StreamCreated",
)!
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const POLL_MS = 30_000

export const useClaimLockEvm = (
  ctx: ClaimContext,
  root: CampaignRoot,
  wallet: string,
  consumption: ArmConsumption,
): ArmLock => {
  const chainId = Number(ctx.chainId)
  const publicClient = useEvmPublicClient(chainId)
  const { distributor, lockHook, targetBatch: batch } = ctx
  const recipient = normalizeEvmAddress(ctx.recipientAddress)
  const account = recipient && isEvmAddress(recipient) ? (recipient as `0x${string}`) : undefined
  const block = consumption.lastClaimedBlock
  const route = useQuery({
    queryKey: [
      "evm",
      "fastdrop-lock-route",
      chainId,
      distributor,
      lockHook,
      root,
      account,
      block?.toString(),
    ],
    queryFn:
      publicClient && distributor && lockHook && account && block && consumption.consumed
        ? async () => {
            const [configurationId] = await getConfigurationIds(publicClient, { distributor, root })
            if (!configurationId) return null
            const [preset, streamId] = await Promise.all([
              getStreamPreset(publicClient, { distributor, lockHook, configurationId }),
              getStreamId(publicClient, { distributor, lockHook, root, recipient: account }),
            ])
            if (preset.lock === ZERO_ADDRESS) return null

            // Mapping value zero is also a valid stream ID. Verify that this
            // batch claim actually created the resolved stream before offering withdrawal.
            const [claims, creations] = await Promise.all([
              publicClient.getLogs({
                address: distributor,
                event: AIRDROP_CLAIMED,
                args: { account },
                fromBlock: block,
                toBlock: block,
                strict: true,
              }),
              publicClient.getLogs({
                address: preset.lock,
                event: STREAM_CREATED,
                args: { creator: lockHook, beneficiary: account },
                fromBlock: block,
                toBlock: block,
                strict: true,
              }),
            ])
            const createdForBatch = creations.some((creation) => {
              if (creation.args.streamId !== streamId) return false
              const nextClaim = claims.find(
                (claim) =>
                  claim.transactionHash === creation.transactionHash &&
                  claim.logIndex > creation.logIndex,
              )
              return nextClaim?.args.root.toLowerCase() === root
            })
            return createdForBatch ? { lock: preset.lock, streamId, configurationId } : null
          }
        : skipToken,
  })
  const stream = useStream({
    chainId,
    lock: route.data?.lock,
    streamId: route.data?.streamId,
    query: { refetchInterval: POLL_MS },
  })
  const position = stream.data?.recipient.toLowerCase() === account ? stream.data : undefined
  const liveStream = position && position.amount > 0n ? position : undefined
  const available = useClaimableAmount({
    chainId,
    lock: route.data?.lock,
    stream: liveStream,
    query: { refetchInterval: POLL_MS },
  })
  const lock = useLockClaimPortalEvm({
    projectId: ctx.deployment,
    chainId: ctx.chainId ?? "",
    distributor,
    lockHook,
    batch: batch ?? "",
    recipientAddress: account ?? "",
    root,
  })

  return {
    position: liveStream
      ? {
          balance: liveStream.amount - liveStream.claimedAmount,
          withdrawable: available.data,
          startTime: liveStream.startTime,
          cliffTime: liveStream.cliffTime,
          endTime: liveStream.endTime,
        }
      : undefined,
    isLoading: route.isLoading || stream.isLoading || available.isLoading,
    isError: route.isError || stream.isError || available.isError,
    withdraw: async () => {
      if (!account || !batch || !liveStream || !available.data || !route.data)
        throw new Error("No unlocked tokens are available.")
      const { address } = await lock.preflight()
      if (
        normalizeEvmAddress(address) !== normalizeEvmAddress(wallet) ||
        normalizeEvmAddress(wallet) !== account
      )
        throw new Error("Connect the allocation's recipient wallet to withdraw.")

      const currentRoute = (await route.refetch({ throwOnError: true })).data
      if (
        !currentRoute ||
        currentRoute.lock !== route.data.lock ||
        currentRoute.streamId !== route.data.streamId ||
        currentRoute.configurationId !== route.data.configurationId
      )
        throw new Error("The lock position changed. Review the updated position.")

      const hash = await lock.runClaim()
      await stream.refetch()
      return hash
    },
  }
}
