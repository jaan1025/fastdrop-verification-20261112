"use client"
import { resolveChainKind } from "@repo/acs-client/model"
import { type Address as SolAddress } from "@repo/chain-solana-kit/config"
import { type Address } from "viem"
import { type ClaimHookResult } from "../claim-hook-result"
import { useLockClaimPortalEvm } from "./use-lock-claim-portal-evm"
import { useLockClaimPortalSolana } from "./use-lock-claim-portal-solana"

export interface UseLockClaimPortalInput {
  /** Active project chainId (numeric EVM string or `sol:<cluster>`). */
  chainId: string | undefined
  /** deploymentId on the wire. */
  projectId: string
  /** Batch name. */
  batch: string
  /** On-chain recipient the existing stream is keyed to. */
  recipientAddress: string
  /** EVM distributor contract (`contract` role). */
  distributor?: Address
  /** EVM lock-hook contract (`lockHook` role). */
  lockHook?: Address
  /** Solana distributor `base` seed (PDA root). */
  base?: SolAddress
  /** Solana merkle root for this (batch, recipient). */
  root?: `0x${string}`
}

/**
 * Chain-dispatch facade for the portal's SUBSEQUENT (existing on-chain stream)
 * lock-hook claim. Both arms mount UNCONDITIONALLY (Rules of Hooks); the inactive
 * chain is disabled by placeholder/empty refs (its `runClaim` never fires), and
 * the active chain's result is returned. Chain kind via `resolveChainKind`.
 */
export function useLockClaimPortal(input: UseLockClaimPortalInput): ClaimHookResult {
  const chainKind = resolveChainKind(input.chainId)
  const isEvm = chainKind === "evm"
  const isSolana = chainKind === "solana"

  const evm = useLockClaimPortalEvm({
    projectId: input.projectId,
    chainId: isEvm ? (input.chainId as string) : "0",
    distributor: isEvm ? input.distributor : undefined,
    lockHook: isEvm ? input.lockHook : undefined,
    batch: input.batch,
    recipientAddress: input.recipientAddress,
  })
  const solana = useLockClaimPortalSolana({
    chainId: isSolana ? input.chainId : undefined,
    base: isSolana ? input.base : undefined,
    root: isSolana ? input.root : undefined,
    recipientAddress: input.recipientAddress,
  })

  return isSolana ? solana : evm
}
