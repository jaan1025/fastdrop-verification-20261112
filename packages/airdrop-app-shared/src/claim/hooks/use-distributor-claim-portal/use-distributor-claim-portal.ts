"use client"
import { resolveChainKind } from "@repo/acs-client/model"
import { type Address as SolAddress } from "@repo/chain-solana-kit/config"
import { type Address } from "viem"
import { type HookContracts } from "@repo/airdrop-evm/contracts"
import { type DistributorClaimPortalResult } from "../claim-hook-result"
import { useDistributorClaimPortalEvm } from "./use-distributor-claim-portal-evm"
import { useDistributorClaimPortalSolana } from "./use-distributor-claim-portal-solana"

export interface UseDistributorClaimPortalInput {
  /** Active project chainId (numeric EVM string or `sol:<cluster>`). */
  chainId: string | undefined
  /** appId on the wire. */
  organizationId: string
  /** deploymentId on the wire. */
  projectId: string
  /** Batch name. */
  batch: string
  /** Optional root pinned by the campaign. */
  expectedRoot?: `0x${string}`
  /** EVM distributor contract (`contract` role). */
  distributor?: Address
  /** EVM hook-contract address book for strategy resolution. */
  hookContracts?: HookContracts
  /** Solana distributor `base` seed (PDA root). */
  base?: SolAddress
  /** Solana shared LUT (`roles.lut`) — threaded into the Solana arm only. */
  commonLut?: SolAddress
  /**
   * On-chain recipient the stream is keyed to (EVM `onBehalfOf`). The SAME value
   * the on-chain probe used.
   */
  recipientAddress: string
}

/**
 * Chain-dispatch facade for the portal's self-sign distributor (INITIAL) claim.
 * Both arms mount UNCONDITIONALLY (Rules of Hooks); the inactive chain is
 * disabled by passing placeholder/empty refs so its claim mutation never fires,
 * and the active chain's result is returned. Chain kind is decided ONCE via
 * `resolveChainKind` — never ad-hoc chainId sniffing.
 */
export function useDistributorClaimPortal(
  input: UseDistributorClaimPortalInput,
): DistributorClaimPortalResult {
  const chainKind = resolveChainKind(input.chainId)
  const isEvm = chainKind === "evm"
  const isSolana = chainKind === "solana"

  const evm = useDistributorClaimPortalEvm({
    organizationId: input.organizationId,
    projectId: input.projectId,
    chainId: isEvm ? (input.chainId as string) : "0",
    distributor: isEvm ? input.distributor : undefined,
    hookContracts: input.hookContracts ?? {},
    batch: input.batch,
    expectedRoot: input.expectedRoot,
    recipientAddress: input.recipientAddress,
  })
  const solana = useDistributorClaimPortalSolana({
    chainId: isSolana ? input.chainId : undefined,
    organizationId: input.organizationId,
    projectId: input.projectId,
    base: isSolana ? input.base : undefined,
    batch: input.batch,
    expectedRoot: input.expectedRoot,
    commonLutAddress: isSolana ? input.commonLut : undefined,
  })

  return isSolana ? solana : evm
}
