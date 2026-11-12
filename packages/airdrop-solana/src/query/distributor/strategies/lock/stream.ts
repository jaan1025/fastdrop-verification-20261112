import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import { getDistributorPDA } from "../../../../contracts/distributor/functions"
import { deriveStreamId } from "../../../../contracts/distributor/strategies/lock/stream-id"
import {
  getStreamPDA,
  getNftBindingPDA,
  fetchStream,
  fetchNftBinding,
  type Stream,
  type NftBinding,
} from "../../../../contracts/lock/functions"
import { hexToBytes } from "@repo/shared/utils"
import { airdropSolanaKeys } from "../../../keys"

export interface SolanaStreamQueryResult {
  stream: Stream
  streamPda: Address
  streamId: Uint8Array
  nftBinding: NftBinding | null
  nftBindingPda: Address
}

export type SolanaStreamData = SolanaStreamQueryResult | null
export type SolanaStreamQueryKey = ReturnType<typeof airdropSolanaKeys.stream>

export const solanaStreamQueryOptions = (params: {
  chain: SolanaChain
  base: Address | undefined
  root: `0x${string}` | undefined
  /** Resolved claimer (`extra.recipient ?? addressHandler`) — the stream PDA is
   * keyed by this (streamId = keccak(distributor‖root‖recipient)). */
  recipient: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, recipient, base, root } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.stream({
      chain,
      base,
      root,
      recipient,
    }),
    queryFn:
      rpc && recipient && base && root
        ? async (): Promise<SolanaStreamData> => {
            const rootBytes = hexToBytes(root)

            const [distributorPda] = await getDistributorPDA(base)

            const streamId = deriveStreamId({
              distributorPda,
              root: rootBytes,
              claimer: recipient,
            })

            const [streamPda] = await getStreamPDA(streamId)
            const [nftBindingPda] = await getNftBindingPDA(streamId)

            const stream = await fetchStream(rpc, streamPda)
            if (!stream) return null

            const nftBinding = await fetchNftBinding(rpc, nftBindingPda)

            return {
              stream,
              streamPda,
              streamId,
              nftBinding,
              nftBindingPda,
            }
          }
        : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
