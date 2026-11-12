import { type PublicClient, type Address, type Hash } from "viem"
import abi from "../abi"

export const getCap = async (
  publicClient: PublicClient,
  params: {
    transferWithCapHook: Address
    distributor: Address
    configurationId: Hash
  },
): Promise<bigint> => {
  const { transferWithCapHook, distributor, configurationId } = params
  return await publicClient.readContract({
    address: transferWithCapHook,
    abi,
    functionName: "caps",
    args: [distributor, configurationId],
  })
}
