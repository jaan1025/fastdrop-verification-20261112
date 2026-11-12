import {
  type Address,
  type Instruction,
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
  getTransferCheckedInstruction as getLegacyTransferChecked,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token"
import {
  getTransferCheckedInstruction as getToken2022TransferChecked,
  TOKEN_2022_PROGRAM_ADDRESS,
} from "@solana-program/token-2022"
import { ensureAta, getMintTokenProgram } from "../../token/ata"
import { walletTx } from "../../transaction"
import { toUserError } from "../../errors"

export interface SplTransferParams {
  /** SPL token mint. */
  mint: Address
  /** Owner pubkey of the destination wallet (ATA is derived). */
  recipient: Address
  /** Raw amount in token's smallest unit. */
  amount: bigint
  /** Token decimals (required for transferChecked). */
  decimals: number
}

export type SplTransferData = string

export const solanaSplTransferMutationOptions = (params: {
  rpc: Rpc<SolanaRpcApi> | undefined
  ws?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  wallet: UiWallet | null
  owner: Address | undefined
  transactionSigner: TransactionSigner | null
}) =>
  ({
    mutationFn: async (variables: SplTransferParams) => {
      try {
        const { rpc, ws, wallet, owner, transactionSigner } = params
        if (!rpc) throw new Error("Solana rpc not ready")
        if (!transactionSigner) throw new Error("Wallet is not connected")
        if (!owner) throw new Error("Wallet is not connected")
        const { mint, recipient, amount, decimals } = variables

        const tokenProgram = await getMintTokenProgram(rpc, mint)

        const senderAta = await ensureAta({
          rpc,
          owner,
          mint,
          payer: owner,
          tokenProgram,
        })
        if (senderAta.instruction !== null) {
          throw new Error("Connected wallet has no token account for this mint — cannot transfer.")
        }

        const recipientAta = await ensureAta({
          rpc,
          owner: recipient,
          mint,
          payer: owner,
          tokenProgram,
        })

        const setupInstructions: Instruction[] = []
        if (recipientAta.instruction) {
          setupInstructions.push(recipientAta.instruction)
        }

        const useToken2022 = tokenProgram === TOKEN_2022_PROGRAM_ADDRESS
        const builder = useToken2022
          ? getToken2022TransferChecked
          : tokenProgram === TOKEN_PROGRAM_ADDRESS
            ? getLegacyTransferChecked
            : null
        if (!builder) {
          throw new Error(`Unknown token program: ${tokenProgram}`)
        }

        const transferInstruction = builder({
          source: senderAta.ata,
          mint,
          destination: recipientAta.ata,
          authority: transactionSigner,
          amount,
          decimals,
        })

        const latestBlockhash = (await rpc.getLatestBlockhash().send()).value

        const message = appendTransactionMessageInstructions(
          [...setupInstructions, transferInstruction],
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
    mutationKey: ["solana", "spl-token", "transfer"] as const,
  }) satisfies UseMutationOptions<SplTransferData, Error, SplTransferParams>
