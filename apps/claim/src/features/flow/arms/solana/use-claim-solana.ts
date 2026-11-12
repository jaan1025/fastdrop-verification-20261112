import { useQueryClient } from "@tanstack/react-query"
import { useDistributorClaimPortalSolana } from "@repo/airdrop-app-shared/claim/hooks/distributor-claim-portal-solana"
import { airdropSolanaKeys } from "@repo/airdrop-solana/keys"
import { getTransactionExplorerLink } from "@repo/chain-solana-kit/transaction"
import { solanaChainFromChainId } from "@repo/chain-solana-kit/config"

import type { CampaignRoot } from "../../live-claim"
import type { ClaimContext } from "../../hooks/use-claim-context"
import type { ArmClaim } from "../claim-arm-context"

export const useClaimSolana = (ctx: ClaimContext, root: CampaignRoot, wallet: string): ArmClaim => {
  const queryClient = useQueryClient()
  const chain = solanaChainFromChainId(ctx.chainId)
  const claim = useDistributorClaimPortalSolana({
    chainId: ctx.chainId,
    organizationId: ctx.organizationId,
    projectId: ctx.deployment,
    base: ctx.base,
    batch: ctx.targetBatch ?? "",
    commonLutAddress: ctx.commonLut,
    expectedRoot: root,
  })

  return {
    prepareClaim: async () => {
      if (!chain || !ctx.base) throw new Error("The campaign's chain is unavailable.")
      if (ctx.recipientAddress !== wallet)
        throw new Error("Connect the allocation's recipient wallet to claim.")
      const connected = await claim.preflight()
      if (connected.address !== wallet)
        throw new Error("The connected wallet changed. Review the claim again.")

      const prepared = await claim.prepareClaim()
      return {
        ...prepared,
        submit: async () => {
          const hash = await prepared.submit()
          void queryClient.invalidateQueries({
            queryKey: [...airdropSolanaKeys.all(), "consumption", chain],
          })
          void queryClient.invalidateQueries({
            queryKey: [...airdropSolanaKeys.all(), "stream", chain],
          })
          return hash
        },
      }
    },
    getExplorerUrl: (hash) => (chain ? getTransactionExplorerLink(hash, { chain }) : ""),
  }
}
