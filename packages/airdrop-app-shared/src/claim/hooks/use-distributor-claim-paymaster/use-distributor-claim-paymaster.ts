"use client"
import { resolveChainKind } from "@repo/acs-client/model"
import { type ClaimHookResult } from "../claim-hook-result"
import { useDistributorClaimPaymasterEvm } from "./use-distributor-claim-paymaster-evm"

export interface UseDistributorClaimPaymasterInput {
  /** Active project chainId (numeric EVM string). Solana has no paymaster. */
  chainId: string | undefined
  /** appId on the wire. */
  organizationId: string
  /** deploymentId on the wire. */
  projectId: string
  /** Batch name. */
  batch: string
}

/**
 * Chain-dispatch facade for the gasless paymaster distributor claim. Paymaster is
 * EVM-ONLY (no Solana relay analogue), so the EVM arm mounts unconditionally and
 * a Solana chainId yields a result whose `runClaim`/`preflight` throw
 * "Paymaster claims are not supported on Solana." This is the simpler honest
 * shape: one real arm + an explicit unsupported guard, no dead Solana arm hook.
 */
export function useDistributorClaimPaymaster(
  input: UseDistributorClaimPaymasterInput,
): ClaimHookResult {
  const chainKind = resolveChainKind(input.chainId)
  const isEvm = chainKind === "evm"

  const evm = useDistributorClaimPaymasterEvm({
    organizationId: input.organizationId,
    projectId: input.projectId,
    chainId: isEvm ? (input.chainId as string) : "0",
    batch: input.batch,
  })

  if (isEvm) return evm

  const unsupported = async (): Promise<never> => {
    throw new Error("Paymaster claims are not supported on Solana.")
  }
  // Reuse the EVM arm's connected-wallet readout (wagmi stays out of this
  // both-chain facade); only the two awaitable steps become the unsupported guard.
  return {
    chainKind: chainKind === "solana" ? "solana" : "evm",
    preflight: unsupported,
    runClaim: unsupported,
    connectedAddress: evm.connectedAddress,
  }
}
