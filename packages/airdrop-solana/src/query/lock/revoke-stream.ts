import {
  type Address,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type TransactionSigner,
} from "@solana/kit"
import type { UiWallet } from "@wallet-standard/react"
import { type UseMutationOptions } from "@tanstack/react-query"
import { toUserError } from "@repo/chain-solana-kit/errors"
import { revokeStream } from "../../contracts/lock/functions"
import { confirmTransaction } from "../../transaction/confirm"

export interface UseRevokeStreamParams {
  /** 32-byte stream identifier — output of `deriveStreamId` on the merkle root + recipient. */
  streamId: Uint8Array
}

export type RevokeStreamData = string

export const solanaRevokeStreamMutationOptions = (params: {
  rpc: Rpc<SolanaRpcApi> | undefined
  ws?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  wallet: UiWallet | null
  account: Address | undefined
  transactionSigner: TransactionSigner | null
}) =>
  ({
    mutationFn: async ({ streamId }: UseRevokeStreamParams) => {
      try {
        const { rpc, ws, wallet, account, transactionSigner } = params
        const handle = await revokeStream({
          rpc,
          ws,
          wallet,
          account,
          revokeAuthority: transactionSigner,
          streamId,
        })
        // rpc is guaranteed non-null here — revokeStream throws early if it is undefined.
        return confirmTransaction(handle, { rpc: rpc!, rpcSubscriptions: ws })
      } catch (e) {
        throw toUserError(e)
      }
    },
    mutationKey: ["solana", "clique-lock", "revokeStream"] as const,
  }) satisfies UseMutationOptions<RevokeStreamData, Error, UseRevokeStreamParams>
