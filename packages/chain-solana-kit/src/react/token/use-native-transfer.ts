"use client"
import { type Address, type Rpc, type SolanaRpcApi, type TransactionSigner } from "@solana/kit"
import type { UiWalletAccount } from "@wallet-standard/react"
import { useMutation } from "@tanstack/react-query"
import type { MutationParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "../../config/network"
import {
  solanaNativeTransferMutationOptions,
  type SolanaNativeTransferParams,
  type SolanaNativeTransferData,
} from "../../query/token/native-transfer"

export type UseNativeTransferParameters<TContext = unknown> = {
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
  account: UiWalletAccount | null
  /** Caller-injected signer — see use-spl-transfer.ts. */
  transactionSigner: TransactionSigner | null
} & MutationParameter<SolanaNativeTransferData, Error, SolanaNativeTransferParams, TContext>

export const useNativeTransfer = <TContext = unknown>(
  parameters: UseNativeTransferParameters<TContext>,
) => {
  const { mutation, rpc, account, transactionSigner } = parameters

  return useMutation({
    ...solanaNativeTransferMutationOptions({
      rpc,
      account: account?.address as Address | undefined,
      transactionSigner,
    }),
    ...mutation,
  })
}
