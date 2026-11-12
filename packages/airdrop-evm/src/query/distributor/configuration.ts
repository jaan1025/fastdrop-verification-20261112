import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type Hash, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import type { Configuration } from "@repo/airdrop-base/distributor"
import { resolveConfiguration } from "../../contracts/distributor/strategies/configuration"
import { type HookContracts } from "../../contracts/distributor/strategies/claim-extra"
import { airdropEvmKeys } from "../keys"

export type EvmConfigurationData = Configuration
export type EvmConfigurationQueryKey = ReturnType<typeof airdropEvmKeys.configuration>

/**
 * The on-chain batch configuration at `configurationIndex` (claim paths
 * hardcode 0), lifted into the base `Configuration` — kinds resolved
 * from the deployment's known hook addresses, penalty window read from the
 * linear-penalty hook. Feeds `configurationClaimable` / `configurationClaimed`.
 */
export const evmConfigurationQueryOptions = (params: {
  chainId: number
  distributor: Address | undefined
  merkleRoot: Hash | undefined
  hookContracts: HookContracts
  configurationIndex?: number
  publicClient: PublicClient | undefined
}) => {
  const { publicClient, merkleRoot, distributor, hookContracts } = params
  const configurationIndex = params.configurationIndex ?? 0
  return queryOptions({
    queryKey: airdropEvmKeys.configuration({
      chainId: params.chainId,
      distributor,
      merkleRoot,
      configurationIndex,
      // Kind resolution depends on the deployment's hook addresses — key them
      // so a roles change can't serve a stale kind mapping.
      linearPenaltyHook: hookContracts.linearPenalty,
      lockHook: hookContracts.lock,
      transferOrCoinFlipHook: hookContracts.transferOrCoinFlip,
      transferWithCapHook: hookContracts.transferWithCap,
    }),
    queryFn:
      publicClient && merkleRoot && distributor
        ? () =>
            resolveConfiguration(publicClient, {
              distributor,
              root: merkleRoot,
              hookContracts,
              configurationIndex,
            })
        : skipToken,
  })
}

export type UseConfigurationParameters = {
  appId: string
  deployment: string
  batch: string | undefined
  chainId: number
  /** Merkle-leaf / allocation key (`addressHandler`) — resolves the batch root. */
  handler: Address | undefined
  distributor: Address | undefined
  hookContracts: HookContracts
  configurationIndex?: number
} & QueryParameter<EvmConfigurationData, Error, EvmConfigurationData, EvmConfigurationQueryKey>
