import { useQuery } from "@tanstack/react-query"
import { isEvmAddress } from "@repo/acs-client/model"
import { evmConsumptionQueryOptions } from "@repo/airdrop-evm/query"
import { useEvmPublicClient } from "@repo/chain-evm-kit/react"

import { campaignDynamicRecipient } from "../../../../lib/campaign-binding"
import type { CampaignRoot } from "../../live-claim"
import type { ClaimContext } from "../../hooks/use-claim-context"
import type { ArmConsumption } from "../claim-arm-context"

export const useClaimConsumptionEvm = (ctx: ClaimContext, root: CampaignRoot): ArmConsumption => {
  const chainId = Number(ctx.chainId)
  const publicClient = useEvmPublicClient(chainId)
  const handler = ctx.addressHandler
  const query = useQuery(
    evmConsumptionQueryOptions({
      appId: ctx.organizationId,
      deployment: ctx.deployment,
      chainId,
      batch: ctx.targetBatch,
      handler: handler && (campaignDynamicRecipient || isEvmAddress(handler)) ? handler : undefined,
      dynamicRecipient: campaignDynamicRecipient,
      distributor: ctx.distributor,
      merkleRoot: root,
      publicClient,
    }),
  )

  return {
    consumed: query.isSuccess ? (query.data?.consumed ?? 0n) : undefined,
    lastClaimedBlock: query.data?.lastClaimedBlock,
  }
}
