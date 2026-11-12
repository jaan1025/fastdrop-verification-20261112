import { useQuery } from "@tanstack/react-query"
import { solRole } from "@repo/airdrop-app-shared/lib"
import { useSolanaReadClients, useMintInfo } from "@repo/chain-solana-kit/react"
import { solanaChainFromChainId, type SolanaChain } from "@repo/chain-solana-kit/config"
import { useDistributor } from "@repo/airdrop-solana/react"
import { getDistributorPDA } from "@repo/airdrop-solana/contracts"

import { type ClaimContext } from "../../hooks/use-claim-context"

type SolAddress = NonNullable<ReturnType<typeof solRole>>

// Solana arm of the claim token's `decimals`: base → distributor PDA (async,
// off-chain) → distributor account mint (`useDistributor`) → mint decimals
// (`useMintInfo`). Requires the project's cluster in the Solana clients registry;
// for a public portal without an admin key that is mainnet-only (see wire-solana
// § the non-mainnet RPC gap). Single-chain leaf (`-solana`).
export const useClaimTokenDecimalsSolana = (ctx: ClaimContext): number | undefined => {
  const solanaChain = solanaChainFromChainId(ctx.chainId)
  const { rpc } = useSolanaReadClients(solanaChain)

  // Distributor PDA is derived from `base` (async, off-chain); memoized by base.
  const pdaQuery = useQuery({
    queryKey: ["claim", "solana", "distributor-pda", ctx.base ?? null],
    queryFn: async (): Promise<SolAddress | undefined> => {
      if (!ctx.base) return undefined
      const [pda] = await getDistributorPDA(ctx.base)
      return pda as SolAddress
    },
    enabled: !!ctx.base,
    staleTime: Infinity,
  })

  const distributorQuery = useDistributor({
    distributor: pdaQuery.data,
    rpc,
    chain: (solanaChain ?? "solana:mainnet") as SolanaChain,
  })
  const mint = distributorQuery.data?.mint as SolAddress | undefined
  const mintInfoQuery = useMintInfo({
    mint,
    rpc,
    chain: (solanaChain ?? "solana:mainnet") as SolanaChain,
  })

  return mintInfoQuery.data?.decimals
}
