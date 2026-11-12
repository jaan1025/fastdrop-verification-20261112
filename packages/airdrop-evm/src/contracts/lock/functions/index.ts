import { type PublicClient, type WalletClient, type Address, type Hash } from "viem"
import { type EvmTxHandle } from "@repo/chain-evm-kit/transaction"
import abi from "../abi"
import { sendTransaction } from "../../../transaction/send"

export type Stream = {
  recipient: Address
  revokeAuthority: Address
  token: Address
  amount: bigint
  claimedAmount: bigint
  startTime: bigint
  cliffTime: bigint
  endTime: bigint
  startUnlockPercentage: bigint
  cliffUnlockPercentage: bigint
  pieceDuration: bigint
}

/**
 * react-query cache discriminator for a {@link Stream}. Concatenates each stream
 * field exactly once, in struct order, into a stable string id used inside
 * `evmKeys.claimableAmount`. Every field of {@link Stream} participates so the
 * key uniquely discriminates a stream's full state.
 *
 * Pinned by lock/pin-cache-identity.test.ts. The key string is purely a cache
 * discriminator (no on-chain / correctness impact); changing it only busts
 * in-flight react-query caches on deploy — transient and harmless.
 */
export const streamCacheId = (stream: Stream): string =>
  `${stream.recipient}-${stream.revokeAuthority}-${stream.token}-${stream.amount}-${stream.claimedAmount}-${stream.startTime}-${stream.cliffTime}-${stream.endTime}-${stream.startUnlockPercentage}-${stream.cliffUnlockPercentage}-${stream.pieceDuration}`

export const getStream = async (
  publicClient: PublicClient,
  params: {
    lock: Address
    streamId: bigint
  },
): Promise<Stream> => {
  const { lock, streamId } = params
  const result = await publicClient.readContract({
    address: lock,
    abi,
    functionName: "streams",
    args: [streamId],
  })

  return {
    recipient: result[0],
    revokeAuthority: result[1],
    token: result[2],
    amount: result[3],
    claimedAmount: result[4],
    startTime: result[5],
    cliffTime: result[6],
    endTime: result[7],
    startUnlockPercentage: result[8],
    cliffUnlockPercentage: result[9],
    pieceDuration: result[10],
  }
}

export const getClaimableAmount = async (
  publicClient: PublicClient,
  params: {
    lock: Address
    stream: Stream
  },
): Promise<bigint> => {
  const { lock, stream } = params
  return await publicClient.readContract({
    address: lock,
    abi,
    functionName: "calculateClaimableAmount",
    args: [stream],
  })
}

export const revokeStream = (
  publicClient: PublicClient,
  walletClient: WalletClient,
  params: { lock: Address; streamId: bigint },
): Promise<EvmTxHandle> => {
  const { lock, streamId } = params
  return sendTransaction({
    write: async () => {
      const { request } = await publicClient.simulateContract({
        address: lock,
        abi,
        functionName: "revokeStream",
        args: [streamId],
        account: walletClient.account!,
      })
      return walletClient.writeContract(request)
    },
    account: walletClient.account!.address,
    publicClient,
  })
}

export { getStreamRevocation, type EvmStreamRevocation } from "./stream-revocation"
