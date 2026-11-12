import { type PublicClient, type Address, type Hash } from "viem"
import abi from "../abi"

export enum TransferOrCoinFlipResult {
  Default = 0,
  Transfer = 1,
  Lose = 2,
  Win = 3,
}

export const getResult = async (
  publicClient: PublicClient,
  params: {
    transferOrCoinFlipHook: Address
    distributor: Address
    root: Hash
    recipient: Address
  },
): Promise<TransferOrCoinFlipResult> => {
  const { transferOrCoinFlipHook, distributor, root, recipient } = params
  return (await publicClient.readContract({
    address: transferOrCoinFlipHook,
    abi,
    functionName: "transferOrCoinFlipResults",
    args: [distributor, root, recipient],
  })) as TransferOrCoinFlipResult
}

export const getWinningConfig = async (
  publicClient: PublicClient,
  params: { transferOrCoinFlipHook: Address },
) => {
  const { transferOrCoinFlipHook } = params
  const [winningReturnRate, winningThreshold] = await Promise.all([
    publicClient.readContract({
      address: transferOrCoinFlipHook,
      abi,
      functionName: "winningReturnRate",
    }),
    publicClient.readContract({
      address: transferOrCoinFlipHook,
      abi,
      functionName: "winningThreshold",
    }),
  ])

  return {
    winningReturnRate: winningReturnRate as bigint,
    winningThreshold: winningThreshold as bigint,
  }
}
