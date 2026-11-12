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
  solanaSplTransferMutationOptions,
  type SplTransferParams,
  type SplTransferData,
} from "../../query/token/spl-transfer"

export type UseSplTransferParameters<TContext = unknown> = {
  rpc: Rpc<SolanaRpcApi> | undefined
  ws?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  chain: SolanaChain
  wallet: UiWallet | null
  account: UiWalletAccount | null
  /**
   * Caller-injected signer value (or a mock in tests). Inversion of control:
   * the hook receives the signer instead of resolving it itself, so it stays
   * trivially mockable and decoupled from any provider tree.
   */
  transactionSigner: TransactionSigner | null
} & MutationParameter<SplTransferData, Error, SplTransferParams, TContext>

export const useSplTransfer = <TContext = unknown>(
  parameters: UseSplTransferParameters<TContext>,
) => {
  const { mutation, rpc, ws, wallet, account, transactionSigner } = parameters

  return useMutation({
    ...solanaSplTransferMutationOptions({
      rpc,
      ws,
      wallet,
      owner: account?.address as Address | undefined,
      transactionSigner,
    }),
    ...mutation,
  })
}
