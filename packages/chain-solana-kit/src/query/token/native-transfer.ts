import { type Address, type Rpc, type SolanaRpcApi, type TransactionSigner } from "@solana/kit"
import { type UseMutationOptions } from "@tanstack/react-query"
import { transferSol } from "../../token/transfer-sol"
import { toUserError } from "../../errors"

export interface SolanaNativeTransferParams {
  destination: Address
  /** Lamports (1 SOL = 1_000_000_000 lamports). */
  amount: bigint
}

export type SolanaNativeTransferData = string

export const solanaNativeTransferMutationOptions = (params: {
  rpc: Rpc<SolanaRpcApi> | undefined
  account: Address | undefined
  transactionSigner: TransactionSigner | null
}) =>
  ({
    mutationFn: async (variables: SolanaNativeTransferParams) => {
      try {
        const { rpc, account, transactionSigner } = params
        if (!rpc) throw new Error("Solana rpc not ready")
        if (!transactionSigner) throw new Error("Wallet is not connected")
        if (!account) throw new Error("Wallet is not connected")
        const sig = await transferSol({
          rpc,
          signer: transactionSigner,
          destination: variables.destination,
          amount: variables.amount,
        })
        return sig as string
      } catch (e) {
        throw toUserError(e)
      }
    },
    mutationKey: ["solana", "native-transfer"] as const,
  }) satisfies UseMutationOptions<SolanaNativeTransferData, Error, SolanaNativeTransferParams>
