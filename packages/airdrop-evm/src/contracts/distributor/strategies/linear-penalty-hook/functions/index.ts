import { type PublicClient, type Address, type Hash } from "viem"
import abi from "../abi"

export const getPenaltyConfig = async (
  publicClient: PublicClient,
  params: {
    linearPenaltyHook: Address
    configurationId: Hash
  },
) => {
  const { linearPenaltyHook, configurationId } = params
  const [beginTime, endTime] = (await publicClient.readContract({
    address: linearPenaltyHook,
    abi,
    functionName: "penaltyConfigs",
    args: [configurationId],
  })) as [bigint, bigint]

  // Raw unix SECONDS, like every other read in this package — display-layer
  // millisecond conversion is the consumer's concern.
  return {
    beginTime: beginTime ?? 0n,
    endTime: endTime ?? 0n,
  }
}
