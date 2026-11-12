import { useSolanaReadClients } from "@repo/chain-solana-kit/react"
import { solanaChainFromChainId } from "@repo/chain-solana-kit/config"
import { useConsumption } from "@repo/airdrop-solana/react"

import { campaignDynamicRecipient } from "../../../../lib/fastdrop-mode"
import type { CampaignRoot } from "../../live-claim"
import type { ClaimContext } from "../../hooks/use-claim-context"
import type { ArmConsumption } from "../claim-arm-context"

export const useClaimConsumptionSolana = (
  ctx: ClaimContext,
  root: CampaignRoot,
): ArmConsumption => {
  const chain = solanaChainFromChainId(ctx.chainId)
  const { rpc } = useSolanaReadClients(chain)
  const query = useConsumption({
    appId: ctx.organizationId,
    deployment: ctx.deployment,
    batch: ctx.targetBatch,
    base: ctx.base,
    root,
    handler: ctx.addressHandler,
    dynamicRecipient: campaignDynamicRecipient,
    rpc: chain ? rpc : undefined,
    chain: chain ?? "solana:mainnet",
  })

  return { consumed: query.isSuccess ? (query.data?.consumed ?? 0n) : undefined }
}
