import { type TransactionReceipt } from "viem"
import { matchUnion } from "@repo/shared/utils"
import { type EvmTxHandle, type EvmConfirmContext } from "./types"
import { eoaConfirm } from "./eoa"
import { safeConfirm } from "./safe"

/**
 * Exhaustively dispatches on `handle.kind` — every variant of `EvmTxHandle`
 * must be handled; adding a new kind is a compile error here.
 *
 * Uses `matchUnion` from `@repo/shared/utils` which enforces exhaustiveness
 * at the type level (no `default` / `else` escape hatch).
 */
export const confirmTransaction = (
  handle: EvmTxHandle,
  ctx: EvmConfirmContext,
): Promise<TransactionReceipt> =>
  matchUnion(handle, "kind", {
    eoa: (h) => eoaConfirm(h, ctx.publicClient, ctx.errorAbis),
    safe: (h) => safeConfirm(h, ctx.publicClient, ctx.errorAbis),
  })
