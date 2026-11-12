"use client"
import { solanaChainFromChainId } from "@repo/chain-solana-kit/config"
import { type Address as SolAddress } from "@repo/chain-solana-kit/config"
import {
  usePreflight,
  useSolana,
  useSolanaReadClients,
  useWalletSigners,
} from "@repo/chain-solana-kit/react"
import { lockHookClaim, confirmTransaction } from "@repo/airdrop-solana/contracts"
import { type ClaimHookResult } from "../claim-hook-result"

export interface UseLockClaimPortalSolanaParams {
  /** The project's chainId — resolves `{rpc,ws,chain}` from the global registry. */
  chainId: string | undefined
  /** Distributor `base` seed (PDA root) — from the per-batch on-chain read. */
  base: SolAddress | undefined
  /** Merkle root for this (batch, recipient) — required by the lock claim. */
  root: `0x${string}` | undefined
  /**
   * On-chain recipient the stream is keyed to. The lock claim keys off it (NOT
   * the connected wallet): the lock transfers to the stored recipient's ATA
   * regardless of caller.
   */
  recipientAddress: string
}

/**
 * Solana arm of the portal's SUBSEQUENT (existing on-chain stream) lock-hook
 * claim. Reproduces the Solana subsequent claim BYTE/ORDER-faithfully, inlining
 * the flow over the PRIMITIVE directly (no chain-pkg claim hook) — NO relay
 * co-sign, NO `distributor.claim`, NO allocation fetch: forward the existing
 * stream's vested portion to the stored recipient via the FROZEN Solana
 * `lockHookClaim` pipeline. The stream is keyed off the recipient (its
 * streamId derives from `root`), so the connected wallet is only the payer.
 *
 * `runClaim` throws before any on-chain path when base/root is missing, so the
 * facade's disabled (`undefined` chainId) arm never reaches a claim. Single-chain
 * leaf (`-solana`).
 */
export function useLockClaimPortalSolana(params: UseLockClaimPortalSolanaParams): ClaimHookResult {
  const { rpc, ws } = useSolanaReadClients(solanaChainFromChainId(params.chainId))
  const { selectedAccount } = useSolana()
  const { getTransactionSigner } = useWalletSigners()
  const { preflight } = usePreflight()
  const connectedAddress = selectedAccount?.address as SolAddress | undefined

  const runClaim = async (): Promise<string> => {
    if (!params.base) throw new Error("Distributor base unresolved.")
    if (!params.root) throw new Error("Merkle root unresolved.")
    if (!rpc) throw new Error("Solana rpc not ready")
    // Re-resolve the connected wallet + signer FRESH at call time (see the admin
    // distributor arm) — a render-captured value is stale after a mid-claim connect.
    const { wallet } = await preflight()
    const payer = getTransactionSigner()
    if (!payer) throw new Error("Wallet is not connected")
    const handle = await lockHookClaim({
      rpc,
      ws,
      wallet,
      payer,
      base: params.base,
      root: params.root,
      recipient: params.recipientAddress as SolAddress,
    })
    return confirmTransaction(handle, { rpc, rpcSubscriptions: ws })
  }

  return {
    chainKind: "solana",
    preflight: async () => {
      const { account } = await preflight()
      return { address: account.address }
    },
    runClaim,
    connectedAddress,
  }
}
