"use client"
import {
  type Address,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type TransactionSigner,
} from "@solana/kit"
import type { UiWallet, UiWalletAccount } from "@wallet-standard/react"
import { useMutation } from "@tanstack/react-query"
import type { MutationParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "../../config/network"
import {
  solanaSplApproveMutationOptions,
  type SplApproveParams,
  type SplApproveData,
} from "../../query/token/spl-approve"

export type UseSplApproveParameters<TContext = unknown> = {
  rpc: Rpc<SolanaRpcApi> | undefined
  ws?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  chain: SolanaChain
  wallet: UiWallet | null
  account: UiWalletAccount | null
  /** Caller-injected signer — see use-spl-transfer.ts. */
  transactionSigner: TransactionSigner | null
} & MutationParameter<SplApproveData, Error, SplApproveParams, TContext>

export const useSplApprove = <TContext = unknown>(
  parameters: UseSplApproveParameters<TContext>,
) => {
  const { mutation, rpc, ws, wallet, account, transactionSigner } = parameters

  return useMutation({
    ...solanaSplApproveMutationOptions({
      rpc,
      ws,
      wallet,
      owner: account?.address as Address | undefined,
      transactionSigner,
    }),
    ...mutation,
  })
}
