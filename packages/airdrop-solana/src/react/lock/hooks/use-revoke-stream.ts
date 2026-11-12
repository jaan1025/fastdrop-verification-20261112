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
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import {
  solanaRevokeStreamMutationOptions,
  type UseRevokeStreamParams,
  type RevokeStreamData,
} from "../../../query/lock"

export type UseRevokeStreamParameters<TContext = unknown> = {
  rpc: Rpc<SolanaRpcApi> | undefined
  ws?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  chain: SolanaChain
  wallet: UiWallet | null
  account: UiWalletAccount | null
  /** Caller-injected signer — see use-spl-transfer.ts. */
  transactionSigner: TransactionSigner | null
} & MutationParameter<RevokeStreamData, Error, UseRevokeStreamParams, TContext>

export const useRevokeStream = <TContext = unknown>(
  parameters: UseRevokeStreamParameters<TContext>,
) => {
  const { mutation, rpc, ws, wallet, account, transactionSigner } = parameters

  return useMutation({
    ...solanaRevokeStreamMutationOptions({
      rpc,
      ws,
      wallet,
      account: account?.address as Address | undefined,
      transactionSigner,
    }),
    ...mutation,
  })
}
