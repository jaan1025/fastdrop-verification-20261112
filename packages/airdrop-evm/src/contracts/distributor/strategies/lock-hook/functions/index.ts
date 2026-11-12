import { type PublicClient, type WalletClient, type Address, type Hash } from "viem"
import { type EvmTxHandle } from "@repo/chain-evm-kit/transaction"
import abi from "../abi"
import { sendTransaction } from "../../../../../transaction/send"

export const getStreamId = async (
  publicClient: PublicClient,
  params: {
    lockHook: Address
    distributor: Address
    root: Hash
    recipient: Address
  },
): Promise<bigint> => {
  const { lockHook, distributor, root, recipient } = params
  return await publicClient.readContract({
    address: lockHook,
    abi,
    functionName: "streamIds",
    args: [distributor, root, recipient],
  })
}

export const getStreamPreset = async (
  publicClient: PublicClient,
  params: {
    lockHook: Address
    distributor: Address
    configurationId: Hash
  },
) => {
  const { lockHook, distributor, configurationId } = params
  const result = await publicClient.readContract({
    address: lockHook,
    abi,
    functionName: "streamPresets",
    args: [distributor, configurationId],
  })

  return {
    startTime: result[0],
    cliffDuration: result[1],
    vestingDuration: result[2],
    startUnlockPercentage: result[3],
    cliffUnlockPercentage: result[4],
    pieceDuration: result[5],
    lock: result[6],
    isFixedStart: result[7],
  }
}

export const claim = (
  publicClient: PublicClient,
  walletClient: WalletClient,
  params: {
    lockHook: Address
    distributor: Address
    root: Hash
    configurationId: Hash
    recipient: Address
  },
): Promise<EvmTxHandle> => {
  const { lockHook, distributor, root, configurationId, recipient } = params
  const args = [distributor, root, configurationId, recipient] as const
  return sendTransaction({
    write: async () => {
      const { request } = await publicClient.simulateContract({
        address: lockHook,
        abi,
        functionName: "claim",
        args,
        account: walletClient.account!,
      })
      return walletClient.writeContract(request)
    },
    account: walletClient.account!.address,
    publicClient,
  })
}

export type StreamPreset = {
  startTime: bigint
  cliffDuration: bigint
  vestingDuration: bigint
  startUnlockPercentage: bigint
  cliffUnlockPercentage: bigint
  pieceDuration: bigint
  lock: Address
  isFixedStart: boolean
}

export const setStreamPreset = (
  publicClient: PublicClient,
  walletClient: WalletClient,
  params: {
    lockHook: Address
    distributor: Address
    configurationId: Hash
    preset: StreamPreset
  },
): Promise<EvmTxHandle> => {
  const { lockHook, distributor, configurationId, preset } = params
  return sendTransaction({
    write: async () => {
      const { request } = await publicClient.simulateContract({
        address: lockHook,
        abi,
        functionName: "setStreamPreset",
        args: [distributor, configurationId, preset],
        account: walletClient.account!,
      })
      return walletClient.writeContract(request)
    },
    account: walletClient.account!.address,
    publicClient,
  })
}
