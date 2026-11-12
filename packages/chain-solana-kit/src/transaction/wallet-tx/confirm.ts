import { matchUnion } from "@repo/shared/utils"
import { type SolanaTxHandle, type ConfirmTransactionContext } from "./types"
import { standardConfirm } from "./standard"
import { squadsxConfirm } from "./squadsx"

/**
 * Resolve and wait for a `SolanaTxHandle` produced by `sendTransaction`.
 *
 * Exhaustively dispatches on `handle.kind` — every variant must be handled;
 * adding a new kind is a compile error here (parallel to the EVM kit's
 * `confirmTransaction`). Uses `matchUnion` from `@repo/shared/utils` which
 * enforces exhaustiveness at the type level (no `default`/`else` escape hatch).
 *
 *   - `standard` → wait for the already-sent transaction to reach `confirmed`.
 *   - `squadsx`  → poll for multisig execution, then confirm the execution tx.
 *
 * Returns the on-chain transaction signature in both cases.
 */
export const confirmTransaction = (
  handle: SolanaTxHandle,
  ctx: ConfirmTransactionContext,
): Promise<string> =>
  matchUnion(handle, "kind", {
    standard: (h) => standardConfirm(h, ctx),
    squadsx: (h) => squadsxConfirm(h, ctx),
  })

export { type ConfirmTransactionContext } from "./types"
