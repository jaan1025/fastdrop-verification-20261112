import { type PublicClient } from "viem"

// Keyed by `(chainId, address)`, NOT address alone: the same address can be a
// smart-contract account on one chain and an EOA on another, so an
// address-only cache produced a cross-chain false positive (analysis 6.8 / L8).
const isSmartContractAccountMap = new Map<string, boolean>()

const cacheKey = (chainId: number, address: `0x${string}`): string =>
  `${chainId}:${address.toLowerCase()}`

export const isSmartContractAccount = async (
  address: `0x${string}`,
  publicClient: PublicClient,
): Promise<boolean> => {
  if (!address) {
    throw new Error("Address is required for checking if it is a smart contract account")
  }
  const chainId = publicClient.chain?.id
  if (chainId === undefined) {
    throw new Error("Public client must be pinned to a chain")
  }
  const key = cacheKey(chainId, address)
  if (isSmartContractAccountMap.has(key)) {
    return isSmartContractAccountMap.get(key)!
  }
  const code = await publicClient.getCode({ address })
  const isSCA = !!code
  isSmartContractAccountMap.set(key, isSCA)
  return isSCA
}
