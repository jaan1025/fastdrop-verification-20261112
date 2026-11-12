import { useQueryClient } from "@tanstack/react-query"
import { normalizeEvmAddress } from "@repo/acs-client/model"
import { useDistributorClaimPortalEvm } from "@repo/airdrop-app-shared/claim/hooks/distributor-claim-portal-evm"
import { airdropEvmKeys } from "@repo/airdrop-evm/keys"
import { useGetTransactionExplorerLink } from "@repo/chain-evm-kit/react"

import type { CampaignRoot } from "../../live-claim"
import type { ClaimContext } from "../../hooks/use-claim-context"
import type { ArmClaim } from "../claim-arm-context"

export const useClaimEvm = (ctx: ClaimContext, root: CampaignRoot, wallet: string): ArmClaim => {
  const queryClient = useQueryClient()
  const { getTransactionExplorerLink } = useGetTransactionExplorerLink({
    chainId: Number(ctx.chainId),
  })
  const claim = useDistributorClaimPortalEvm({
    organizationId: ctx.organizationId,
    projectId: ctx.deployment,
    chainId: ctx.chainId ?? "",
    distributor: ctx.distributor,
    hookContracts: ctx.hookContracts,
    batch: ctx.targetBatch ?? "",
    recipientAddress: ctx.recipientAddress ?? "",
    expectedRoot: root,
  })

  return {
    prepareClaim: async () => {
      if (normalizeEvmAddress(ctx.recipientAddress) !== normalizeEvmAddress(wallet))
        throw new Error("Connect the allocation's recipient wallet to claim.")
      const connected = await claim.preflight()
      if (normalizeEvmAddress(connected.address) !== normalizeEvmAddress(wallet))
        throw new Error("The connected wallet changed. Review the claim again.")

      const prepared = await claim.prepareClaim()
      return {
        ...prepared,
        submit: async () => {
          const hash = await prepared.submit()
          void queryClient.invalidateQueries({ queryKey: airdropEvmKeys.allConsumption() })
          return hash
        },
      }
    },
    getExplorerUrl: (hash) => getTransactionExplorerLink(hash as `0x${string}`),
  }
}
