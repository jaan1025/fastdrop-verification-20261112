import { walletTx, type SolanaTxHandle } from "@repo/chain-solana-kit/transaction"
import {
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
} from "@solana/kit"
import { resolveCliqueProgramError } from "../errors"

export type { SolanaTxHandle }

/**
 * Confirm a Solana transaction handle with the Clique program-error resolver
 * baked in.
 *
 * Callers (e.g. `airdrop-app-shared` claim facades) pass a handle returned by
 * any of the `airdrop-solana` write ops (`distributorClaim`, `lockHookClaim`,
 * `revokeStream`) and `{ rpc, rpcSubscriptions? }`; `resolveCliqueProgramError`
 * is injected here — callers never need to thread it.
 */
export const confirmTransaction = (
  handle: SolanaTxHandle,
  ctx: {
    rpc: Rpc<SolanaRpcApi>
    rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  },
): Promise<string> =>
  walletTx.confirm(handle, {
    rpc: ctx.rpc,
    rpcSubscriptions: ctx.rpcSubscriptions,
    resolveProgramError: resolveCliqueProgramError,
  })
