import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  getDistributorPDA,
  getClaimRootPDA,
  resolveConfigurators,
  type ConfiguratorInfo,
} from "../../contracts/distributor/functions"
import { hexToBytes } from "@repo/shared/utils"
import { airdropSolanaKeys } from "../keys"

export type { ConfiguratorInfo }

export interface SolanaConfiguratorsResult {
  configurators: ConfiguratorInfo[]
}

export type SolanaConfiguratorsData = SolanaConfiguratorsResult | null
export type SolanaConfiguratorsQueryKey = ReturnType<typeof airdropSolanaKeys.configurators>

export const solanaConfiguratorsQueryOptions = (params: {
  chain: SolanaChain
  appId: string
  deployment: string
  batch: string | undefined
  base: Address | undefined
  root: `0x${string}` | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, base, root } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.configurators({
      chain,
      appId: params.appId,
      deployment: params.deployment,
      batch: params.batch,
      base,
      root,
    }),
    queryFn:
      rpc && base && root
        ? async (): Promise<SolanaConfiguratorsData> => {
            const rootBytes = hexToBytes(root)

            const [distributorPda] = await getDistributorPDA(base)
            const [claimRootPda] = await getClaimRootPDA({
              distributor: distributorPda,
              root: rootBytes,
            })

            const configurators = await resolveConfigurators(rpc, distributorPda, claimRootPda)

            if (!configurators.length) return null
            return { configurators }
          }
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
