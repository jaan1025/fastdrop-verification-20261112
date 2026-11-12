import {
  waitForTransactionReceipt,
  type WaitForReceiptClient,
} from "@repo/chain-evm-kit/transaction"
import { confirm as solanaConfirm } from "@repo/chain-solana-kit/transaction"
import { type SolanaReadClients } from "@repo/chain-solana-kit/react"
import { assertNever } from "@repo/shared/utils"

/**
 * Discriminated on `chainKind` so each arm carries only its own dependencies —
 * the EVM arm a `publicClient`, the Solana arm the rpc/ws pair. No arm sees the
 * other chain's fields.
 */
export type ConfirmTxParams =
  | {
      chainKind: "evm"
      txHash: string
      publicClient: WaitForReceiptClient | undefined
    }
  | {
      chainKind: "solana"
      txHash: string
      /** From the global registry (`useSolanaReadClients`); `undefined` until seeded. */
      rpc: SolanaReadClients["rpc"]
      rpcSubscriptions: SolanaReadClients["ws"]
    }

/**
 * Per-chain transaction finality: a `switch` on `chainKind` (the language's
 * equivalent of pattern destructuring, tailed by `assertNever`) narrows each arm
 * to its own fields and calls that chain's kit finality primitive directly —
 * `waitForTransactionReceipt` (chain-evm-kit) / `confirm` (chain-solana-kit). A
 * both-chain dispatcher can't live in either kit (the kits never import each
 * other), so this facade is its home. The deploy engine, distributor-action
 * twins, batch-sync ops, and configuration-create all share it.
 */
export async function confirmTx(params: ConfirmTxParams): Promise<void> {
  switch (params.chainKind) {
    case "evm":
      if (!params.publicClient) throw new Error("EVM public client unavailable.")
      // Kit default (no errorAbis): a revert surfaces the generic message —
      // the finality facade decodes no Clique reverts. Receipt discarded.
      await waitForTransactionReceipt(params.publicClient, params.txHash as `0x${string}`)
      return
    case "solana":
      // Confirmation runs after a successful tx, so rpc is seeded by now; guard
      // for the type (registry rpc is `| undefined`) and fail loud otherwise.
      if (!params.rpc) throw new Error("Solana rpc not ready for tx confirmation")
      // `finalized` matches the backend deploy preflight — avoids the first-deploy
      // commitment race where a `confirmed` gate races ahead of the relay.
      await solanaConfirm({
        rpc: params.rpc,
        rpcSubscriptions: params.rpcSubscriptions,
        txSignature: params.txHash as Parameters<typeof solanaConfirm>[0]["txSignature"],
        commitment: "finalized",
      })
      return
    default:
      assertNever(params)
  }
}
