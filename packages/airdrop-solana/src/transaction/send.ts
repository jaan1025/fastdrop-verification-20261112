import {
  walletTx,
  type SolanaTxHandle,
  type SendTransactionParams,
} from "@repo/chain-solana-kit/transaction"
import { resolveCliqueProgramError } from "../errors"

export type { SolanaTxHandle }

/**
 * Send a Solana transaction with the Clique program-error resolver baked in —
 * the send-half mirror of `confirmTransaction`. Write ops (`distributorClaim`,
 * `lockHookClaim`, `revokeStream`) call this instead of threading
 * `resolveCliqueProgramError` into the kit's `walletTx.send`; the DI converges here.
 */
export const sendTransaction = (
  params: Omit<SendTransactionParams, "resolveProgramError">,
): Promise<SolanaTxHandle> =>
  walletTx.send({ ...params, resolveProgramError: resolveCliqueProgramError })
