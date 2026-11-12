import { type SolanaTxHandle, type ConfirmTransactionContext } from "../types"
import { confirm } from "./primitives/confirm"

/**
 * SquadsX `confirm`: poll until the proposal executes, then confirm the
 * execution transaction and return its signature. Thin adapter that unwraps the
 * handle and delegates to the `primitives/confirm` composition. Parallel to the
 * EVM kit's `safe/confirm.ts`.
 */
export const squadsxConfirm = async (
  handle: SolanaTxHandle & { kind: "squadsx" },
  ctx: ConfirmTransactionContext,
): Promise<string> =>
  confirm({
    rpc: ctx.rpc,
    rpcSubscriptions: ctx.rpcSubscriptions,
    proposalSignature: handle.proposalSignature,
  })
