import { evmRole } from "@repo/airdrop-app-shared/lib"
import { useTokenDecimals } from "@repo/chain-evm-kit/react"
import { useToken } from "@repo/airdrop-evm/react"

import { type ClaimContext } from "../../hooks/use-claim-context"

type EvmAddress = NonNullable<ReturnType<typeof evmRole>>

// EVM arm of the claim token's `decimals` (for `<TokenAmount>` formatting on the
// action + complete steps). mono did this with `useDistributorTokenQuery →
// useTokenMetadataQuery`: distributor → token address (`useToken`) → decimals
// (`useTokenDecimals`). Single-chain leaf (`-evm`).
export const useClaimTokenDecimalsEvm = (ctx: ClaimContext): number | undefined => {
  const evmChainId = ctx.chainId ? Number(ctx.chainId) : 0
  const tokenQuery = useToken({ chainId: evmChainId, distributor: ctx.distributor })
  const decimalsQuery = useTokenDecimals({
    chainId: evmChainId,
    token: tokenQuery.data as EvmAddress | undefined,
  })
  return decimalsQuery.data
}
