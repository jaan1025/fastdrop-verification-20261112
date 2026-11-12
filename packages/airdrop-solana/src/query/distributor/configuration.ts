import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import type { Configuration } from "@repo/airdrop-base/distributor"
import {
  getDistributorPDA,
  getClaimRootPDA,
  getBatchConfigPDA,
  fetchClaimRoot,
  fetchBatchConfig,
} from "../../contracts/distributor/functions"
import { resolveConfiguration } from "../../contracts/distributor/strategies"
import { toUint8Array } from "@repo/chain-solana-kit/utils"
import { hexToBytes } from "@repo/shared/utils"
import { airdropSolanaKeys } from "../keys"

export type SolanaConfigurationData = Configuration | null
export type SolanaConfigurationQueryKey = ReturnType<typeof airdropSolanaKeys.configuration>

/**
 * The on-chain batch configuration at `configurationIndex` (claim paths
 * hardcode 0), lifted into the base `Configuration` — strategies with
 * kinds + proportions + penalty terms, ready for `configurationClaimable` /
 * `configurationClaimed`. `null` when the root or its configurator/batch
 * config is not on-chain.
 */
export const solanaConfigurationQueryOptions = (params: {
  chain: SolanaChain
  base: Address | undefined
  root: `0x${string}` | undefined
  configurationIndex?: number
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, base, root } = params
  const configurationIndex = params.configurationIndex ?? 0
  return queryOptions({
    queryKey: airdropSolanaKeys.configuration({
      chain,
      base,
      root,
      configurationIndex,
    }),
    queryFn:
      rpc && base && root
        ? async (): Promise<SolanaConfigurationData> => {
            const rootBytes = hexToBytes(root)

            const [distributorPda] = await getDistributorPDA(base)
            const [claimRootPda] = await getClaimRootPDA({
              distributor: distributorPda,
              root: rootBytes,
            })

            const claimRoot = await fetchClaimRoot(rpc, claimRootPda)
            const configuratorBytes = claimRoot?.configurators[configurationIndex]
            if (!configuratorBytes) return null
            const configurator = toUint8Array(configuratorBytes)

            const [batchConfigPda] = await getBatchConfigPDA({
              distributor: distributorPda,
              configurator,
            })
            const batchConfig = await fetchBatchConfig(rpc, batchConfigPda)
            if (!batchConfig) return null

            return resolveConfiguration(rpc, {
              distributorPda,
              configurator,
              strategies: batchConfig.strategies,
              fallbackHook: batchConfig.fallbackHook,
            })
          }
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
