import { type PublicClient } from "viem"

const SAFE_THRESHOLD_ABI = [
  {
    name: "getThreshold",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const

/**
 * Probes whether `account` is a Safe multisig by calling its `getThreshold()`
 * view function. If the call resolves (returns a bigint), the account is a Safe;
 * any thrown error (revert, non-contract, etc.) means it is not.
 *
 * Key-free: no Safe Transaction Service API call is made here.
 */
export const isSafeAccount = async (
  account: `0x${string}`,
  publicClient: PublicClient,
): Promise<boolean> => {
  try {
    await publicClient.readContract({
      address: account,
      abi: SAFE_THRESHOLD_ABI,
      functionName: "getThreshold",
    })
    return true
  } catch {
    return false
  }
}
