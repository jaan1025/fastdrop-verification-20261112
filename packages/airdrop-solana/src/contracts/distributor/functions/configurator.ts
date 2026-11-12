import type { Address, Rpc, SolanaRpcApi } from "@solana/kit"
import { getBatchConfigPDA } from "./pda"
import { fetchClaimRoot, fetchBatchConfig, type BatchConfig } from "./fetch"
import { toUint8Array } from "@repo/chain-solana-kit/utils"

export interface ConfiguratorInfo {
  index: number
  configurator: Uint8Array
  strategies: BatchConfig["strategies"]
  fallbackHook: number
  batchConfigPda: Address
}

/**
 * Resolve all configurators for a given claim root.
 * Fetches ClaimRoot → iterates configurators → fetches BatchConfig for each.
 */
export const resolveConfigurators = async (
  rpc: Rpc<SolanaRpcApi>,
  distributorPda: Address,
  claimRootPda: Address,
): Promise<ConfiguratorInfo[]> => {
  const claimRoot = await fetchClaimRoot(rpc, claimRootPda)
  if (!claimRoot?.configurators.length) return []

  const results: ConfiguratorInfo[] = []
  for (let i = 0; i < claimRoot.configurators.length; i++) {
    const configurator = toUint8Array(claimRoot.configurators[i]!)
    const [batchConfigPda] = await getBatchConfigPDA({
      distributor: distributorPda,
      configurator,
    })
    const batchConfig = await fetchBatchConfig(rpc, batchConfigPda)
    if (!batchConfig) continue
    results.push({
      index: i,
      configurator,
      strategies: batchConfig.strategies,
      fallbackHook: batchConfig.fallbackHook,
      batchConfigPda,
    })
  }

  return results
}
