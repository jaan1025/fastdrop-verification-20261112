import {
  type Address,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type TransactionSigner,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit"
import type { UiWallet } from "@wallet-standard/react"
import { type UseMutationOptions } from "@tanstack/react-query"
import {
  getApproveCheckedInstruction as getLegacyApproveChecked,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token"
import {
  getApproveCheckedInstruction as getToken2022ApproveChecked,
  TOKEN_2022_PROGRAM_ADDRESS,
} from "@solana-program/token-2022"
import { deriveAta, getMintTokenProgram } from "../../token/ata"
import { walletTx } from "../../transaction"
import { toUserError } from "../../errors"

export interface SplApproveParams {
  /** SPL token mint. */
  mint: Address
  /** Delegate that may spend from the source token account (e.g. distributor PDA). */
  delegate: Address
  /** Raw amount in token's smallest unit. */
  amount: bigint
  /** Token decimals (required for approveChecked). */
  decimals: number
}

export type SplApproveData = string

export const solanaSplApproveMutationOptions = (params: {
  rpc: Rpc<SolanaRpcApi> | undefined
  ws?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  wallet: UiWallet | null
  owner: Address | undefined
  transactionSigner: TransactionSigner | null
}) =>
  ({
    mutationFn: async (variables: SplApproveParams) => {
      try {
        const { rpc, ws, wallet, owner, transactionSigner } = params
        if (!rpc) throw new Error("Solana rpc not ready")
        if (!transactionSigner) throw new Error("Wallet is not connected")
        if (!owner) throw new Error("Wallet is not connected")
        const { mint, delegate, amount, decimals } = variables

        const tokenProgram = await getMintTokenProgram(rpc, mint)
        const ownerAta = await deriveAta(owner, mint, tokenProgram)

        const useToken2022 = tokenProgram === TOKEN_2022_PROGRAM_ADDRESS
        const builder = useToken2022
          ? getToken2022ApproveChecked
          : tokenProgram === TOKEN_PROGRAM_ADDRESS
            ? getLegacyApproveChecked
            : null
        if (!builder) {
          throw new Error(`Unknown token program: ${tokenProgram}`)
        }

        const approveInstruction = builder({
          source: ownerAta,
          mint,
          delegate,
          owner: transactionSigner,
          amount,
          decimals,
        })

        const latestBlockhash = (await rpc.getLatestBlockhash().send()).value

        const message = appendTransactionMessageInstructions(
          [approveInstruction],
          setTransactionMessageLifetimeUsingBlockhash(
            latestBlockhash,
            setTransactionMessageFeePayerSigner(
              transactionSigner,
              createTransactionMessage({ version: 0 }),
            ),
          ),
        )

        return walletTx.sendAndConfirm({
          rpc,
          rpcSubscriptions: ws,
          txMessage: message,
          wallet,
        })
      } catch (e) {
        throw toUserError(e)
      }
    },
    mutationKey: ["solana", "spl-token", "approve"] as const,
  }) satisfies UseMutationOptions<SplApproveData, Error, SplApproveParams>
