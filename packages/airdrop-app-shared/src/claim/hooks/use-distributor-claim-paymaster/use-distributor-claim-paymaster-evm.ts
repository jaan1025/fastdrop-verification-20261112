"use client"
import { type Hash } from "viem"
import { useAccount, usePublicClient as useViemPublicClient } from "wagmi"
import { buildEvmForcedTransferClaimExtra, confirmTransaction } from "@repo/airdrop-evm/contracts"
import { usePreflight, useEnsureToSSigned } from "@repo/chain-evm-kit/react"
import { usePublicClient as useAcsPublicClient } from "@repo/acs-client/react"
import { getUserAllocation, getClaimData, paymasterClaim } from "@repo/acs-client/actions"
import { deriveHandlerHash } from "@repo/airdrop-base/distributor"
import { toBigInt } from "@repo/shared/utils"
import { type ClaimHookResult } from "../claim-hook-result"

export interface UseDistributorClaimPaymasterEvmParams {
  /** appId on the wire — drives the ToS signer. */
  organizationId: string
  /** deploymentId on the wire. */
  projectId: string
  /** Active project's numeric EVM chainId (string from appConf). */
  chainId: string
  /** Batch name. */
  batch: string
}

/**
 * EVM paymaster (gasless relay) distributor claim arm. Reproduces
 * `run-paymaster-claim` BYTE/ORDER-faithfully:
 *
 *   ToS self-sign → `getUserAllocation` → force a single full-WAD
 *   transfer-strategy `_extra` via the FROZEN `buildEvmForcedTransferClaimExtra`
 *   → `getClaimData` co-sign → `paymasterClaim` (the gasless relay SUBMITS; NO
 *   on-chain write) → wait for the mined receipt.
 *
 * EVM-only — Solana has no paymaster relay. Single-chain leaf (`-evm`).
 */
export function useDistributorClaimPaymasterEvm(
  params: UseDistributorClaimPaymasterEvmParams,
): ClaimHookResult {
  const acsClient = useAcsPublicClient()
  const { address } = useAccount()
  const evmChainId = Number(params.chainId)
  const viemPublicClient = useViemPublicClient({ chainId: evmChainId })
  const { preflight } = usePreflight({ chainId: evmChainId })
  const { ensureToSSigned } = useEnsureToSSigned({
    appId: params.organizationId,
    chainId: evmChainId,
  })

  const runClaim = async (): Promise<string> => {
    if (!viemPublicClient) throw new Error("Public client unavailable.")
    const account = address
    if (!account) throw new Error("Address is required")

    if (!params.batch) throw new Error("Batch is required")

    const tosSignature = await ensureToSSigned()

    const batchData = await getUserAllocation(acsClient, {
      batch: params.batch,
      address: account,
      deploymentId: params.projectId,
    })
    const { allocation, addressHandler } = batchData ?? {}
    if (!allocation) throw new Error("Invalid allocation value")
    if (!addressHandler) throw new Error("Invalid address handler value")

    const extra = buildEvmForcedTransferClaimExtra(toBigInt(allocation))

    const claimData = await getClaimData(acsClient, {
      batch: params.batch,
      addressHandler,
      sig: tosSignature,
      extra,
      deploymentId: params.projectId,
    })
    const { released, sig } = claimData ?? {}
    const proof = (batchData?.extra?.proof ?? []) as Hash[]
    if (!sig) throw new Error("Invalid sig value")
    if (!proof.length) throw new Error("Proof is required")

    const { txHash } = await paymasterClaim(acsClient, {
      batch: params.batch,
      proof,
      signature: sig,
      amount: allocation,
      released,
      handler: deriveHandlerHash(addressHandler),
      onBehalfOf: account,
      extra,
      deploymentId: params.projectId,
    })

    const receipt = await confirmTransaction(
      { kind: "eoa", hash: txHash as `0x${string}` },
      { publicClient: viemPublicClient },
    )
    return receipt.transactionHash
  }

  return {
    chainKind: "evm",
    preflight: async () => {
      const { address: connected } = await preflight()
      return { address: connected }
    },
    runClaim,
    connectedAddress: address,
  }
}
