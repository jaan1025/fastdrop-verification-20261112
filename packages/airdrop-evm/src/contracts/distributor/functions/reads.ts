import { type PublicClient, type Address, type Hash } from "viem"
import abi from "../abi"

type Strategy = {
  proportion: bigint
  hook: Address
}

export const getRequiredFee = async (
  publicClient: PublicClient,
  params: { distributor: Address; root: Hash; amount: bigint },
): Promise<bigint> => {
  const { distributor, root, amount } = params
  return await publicClient.readContract({
    address: distributor,
    abi,
    functionName: "requiredFee",
    args: [root, amount],
  })
}

export const getToken = async (
  publicClient: PublicClient,
  params: { distributor: Address },
): Promise<Address> =>
  publicClient.readContract({
    address: params.distributor,
    abi,
    functionName: "token",
  })

export const getVault = async (
  publicClient: PublicClient,
  params: { distributor: Address },
): Promise<Address> =>
  publicClient.readContract({
    address: params.distributor,
    abi,
    functionName: "vault",
  })

export const getActive = async (
  publicClient: PublicClient,
  params: { distributor: Address },
): Promise<boolean> =>
  publicClient.readContract({
    address: params.distributor,
    abi,
    functionName: "active",
  })

export const getDynamicRecipient = async (
  publicClient: PublicClient,
  params: { distributor: Address },
): Promise<boolean> =>
  publicClient.readContract({
    address: params.distributor,
    abi,
    functionName: "dynamicRecipient",
  })

export const getFeeMode = async (
  publicClient: PublicClient,
  params: { distributor: Address; root: Hash },
): Promise<number> =>
  publicClient.readContract({
    address: params.distributor,
    abi,
    functionName: "feeModes",
    args: [params.root],
  })

export const getFixedFee = async (
  publicClient: PublicClient,
  params: { distributor: Address; root: Hash },
): Promise<bigint> =>
  publicClient.readContract({
    address: params.distributor,
    abi,
    functionName: "fixedFees",
    args: [params.root],
  })

export const getSingleTierFeeRate = async (
  publicClient: PublicClient,
  params: { distributor: Address; root: Hash },
): Promise<{ feeRate: bigint; minFee: bigint; maxFee: bigint }> => {
  const [feeRate, minFee, maxFee] = await publicClient.readContract({
    address: params.distributor,
    abi,
    functionName: "singleTierFeeRates",
    args: [params.root],
  })
  return { feeRate, minFee, maxFee }
}

/**
 * The allocation's consumption ledger. The on-chain mapping is named `claimed`,
 * but `ClaimInfo.claimedAmount` records the CONSUMED allocation (= `released`
 * at the last claim), NOT what reached the wallet — decompose via the base
 * strategy model (`configurationClaimed`) into wallet-claimed / forfeited /
 * locked.
 */
export const getConsumption = async (
  publicClient: PublicClient,
  params: { distributor: Address; root: Hash; handlerHash: Hash },
) => {
  const { distributor, root, handlerHash } = params
  const result = await publicClient.readContract({
    address: distributor,
    abi,
    functionName: "claimed",
    args: [root, handlerHash],
  })
  if (!result) return null
  return { lastClaimedBlock: result[0], consumed: result[1] }
}

export const getConfigurationIds = async (
  publicClient: PublicClient,
  params: { distributor: Address; root: Hash },
): Promise<Hash[]> => {
  const { distributor, root } = params
  const result = await publicClient.readContract({
    address: distributor,
    abi,
    functionName: "getConfigurationIds",
    args: [root],
  })
  return [...result]
}

export const getConfigurationIdAt = async (
  publicClient: PublicClient,
  params: { distributor: Address; root: Hash; index: number },
): Promise<Hash> => {
  const { distributor, root, index } = params
  return await publicClient.readContract({
    address: distributor,
    abi,
    functionName: "configurationIdAt",
    args: [root, BigInt(index)],
  })
}

export const getStrategies = async (
  publicClient: PublicClient,
  params: { distributor: Address; root: Hash; configurationIndex?: number },
): Promise<{
  strategies: readonly Strategy[]
  fallbackHook: bigint
  configurationId: Hash
}> => {
  const { distributor, root, configurationIndex = 0 } = params

  const configurationId = await getConfigurationIdAt(publicClient, {
    distributor,
    root,
    index: configurationIndex,
  })

  const { strategies, fallbackHook } = await publicClient.readContract({
    address: distributor,
    abi,
    functionName: "getBatchConfiguration",
    args: [configurationId],
  })

  // `configurationId` is surfaced so penalty-aware claim flows don't re-fetch it
  // for per-hook `_consumed` prediction (see `resolveHookConsumed`).
  return { strategies, fallbackHook, configurationId }
}
