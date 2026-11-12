import { type Signature } from "@solana/kit"
import { confirm } from "../../confirm"
import { type SolanaTxHandle, type ConfirmTransactionContext } from "../types"

/**
 * Standard `confirm`: wait for the already-sent transaction to reach
 * `confirmed`. Parallel to the EVM kit's `eoa/confirm.ts`.
 */
export const standardConfirm = async (
  handle: SolanaTxHandle & { kind: "standard" },
  ctx: ConfirmTransactionContext,
): Promise<string> => {
  await confirm({
    rpc: ctx.rpc,
    rpcSubscriptions: ctx.rpcSubscriptions,
    txSignature: handle.signature as Signature,
  })
  return handle.signature
}
