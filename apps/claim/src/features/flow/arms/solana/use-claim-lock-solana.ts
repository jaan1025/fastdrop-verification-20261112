import { isSolanaAddressFormat } from "@repo/acs-client/model"
import { useLockClaimPortalSolana } from "@repo/airdrop-app-shared/claim/hooks/lock-claim-portal-solana"
import { useClaimableAmount, useStream } from "@repo/airdrop-solana/react"
import { solanaChainFromChainId, type Address } from "@repo/chain-solana-kit/config"
import { useSolanaReadClients } from "@repo/chain-solana-kit/react"

import type { CampaignRoot } from "../../live-claim"
import type { ClaimContext } from "../../hooks/use-claim-context"
import type { ArmConsumption, ArmLock } from "../claim-arm-context"

const POLL_MS = 30_000

export const useClaimLockSolana = (
  ctx: ClaimContext,
  root: CampaignRoot,
  wallet: string,
  consumption: ArmConsumption,
): ArmLock => {
  const chain = solanaChainFromChainId(ctx.chainId)
  const { rpc } = useSolanaReadClients(chain)
  const recipient = ctx.recipientAddress
  const account = recipient && isSolanaAddressFormat(recipient) ? (recipient as Address) : undefined
  const stream = useStream({
    chain: chain ?? "solana:mainnet",
    rpc: chain ? rpc : undefined,
    base: ctx.base,
    root,
    recipient: consumption.consumed ? account : undefined,
    query: { staleTime: POLL_MS, refetchInterval: POLL_MS },
  })
  const liveStream = stream.data?.stream.recipient === account ? stream.data?.stream : undefined
  const available = useClaimableAmount({
    stream: liveStream,
    query: { refetchInterval: POLL_MS },
  })
  const lock = useLockClaimPortalSolana({
    chainId: ctx.chainId,
    base: ctx.base,
    root,
    recipientAddress: account ?? "",
  })

  return {
    position: liveStream
      ? {
          balance: liveStream.amount - liveStream.claimedAmount,
          withdrawable: available.data?.claimable,
          startTime: liveStream.startTime,
          cliffTime: liveStream.cliffTime,
          endTime: liveStream.endTime,
        }
      : undefined,
    isLoading: stream.isLoading || available.isLoading,
    isError: stream.isError || available.isError,
    withdraw: async () => {
      if (!chain || !account || !liveStream || !available.data?.claimable)
        throw new Error("No unlocked tokens are available.")
      const { address } = await lock.preflight()
      if (address !== wallet || address !== account)
        throw new Error("Connect the allocation's recipient wallet to withdraw.")
      const hash = await lock.runClaim()
      await stream.refetch()
      return hash
    },
  }
}
