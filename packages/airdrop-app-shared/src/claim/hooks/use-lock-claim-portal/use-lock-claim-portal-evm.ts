"use client"
import { useQueryClient } from "@tanstack/react-query"
import { type Address, type Hash } from "viem"
import { useAccount, useConfig, usePublicClient as useViemPublicClient } from "wagmi"
import { getWalletClient } from "wagmi/actions"
import {
  getConfigurationIdAt,
  lockHookClaim,
  confirmTransaction,
} from "@repo/airdrop-evm/contracts"
import { usePreflight } from "@repo/chain-evm-kit/react"
import { usePublicClient as useAcsPublicClient } from "@repo/acs-client/react"
import { userAllocationsQueryOptions } from "@repo/acs-client/query"
import { computeMerkleRoot } from "@repo/airdrop-base/distributor"
import { toBigInt } from "@repo/shared/utils"
import { type ClaimHookResult } from "../claim-hook-result"

export interface UseLockClaimPortalEvmParams {
  /** deploymentId on the wire. */
  projectId: string
  /** Active project's numeric EVM chainId (string from appConf). */
  chainId: string
  /** Distributor contract (the `contract` role). */
  distributor: Address | undefined
  /** Lock-hook contract (`lockHook` role). */
  lockHook: Address | undefined
  /** The reviewed campaign root, when the caller has already bound the lock position. */
  root?: Hash
  /** Batch name. */
  batch: string
  /**
   * On-chain recipient the stream is keyed to — `extra.recipient ??
   * addressHandler`, the SAME value the on-chain probe uses. Drives root
   * derivation and the lock-hook `recipient`.
   */
  recipientAddress: string
}

/**
 * EVM arm of the portal's SUBSEQUENT (existing on-chain stream) lock-hook claim.
 * Reproduces `use-portal-claim-evm`'s `hasOnChainStream` branch BYTE/ORDER-
 * faithfully — NO relay co-sign, NO `distributor.claim`:
 *
 *   use the reviewed root or re-derive it from the recipient's proof (via the kernel
 *   `computeMerkleRoot`) → resolve the first `configurationId` on-chain
 *   (`getConfigurationIdAt`) → `lockHookClaim(pc, wc, { lockHook, distributor,
 *   root, configurationId, recipient })` → `EvmTxHandle`
 *   → `confirmTransaction(handle, { publicClient })`.
 *
 * `fetchQuery` reuses the public allocations cache (no refetch on reopen).
 * Single-chain leaf (`-evm`).
 */
export function useLockClaimPortalEvm(params: UseLockClaimPortalEvmParams): ClaimHookResult {
  const queryClient = useQueryClient()
  const acsClient = useAcsPublicClient()
  const { address } = useAccount()
  const evmChainId = Number(params.chainId)
  const viemPublicClient = useViemPublicClient({ chainId: evmChainId })
  const config = useConfig()
  const { preflight } = usePreflight({ chainId: evmChainId })

  const runClaim = async (): Promise<string> => {
    if (!viemPublicClient) throw new Error("Public client unavailable.")
    if (!params.distributor) throw new Error("Distributor unresolved.")
    if (!params.lockHook) throw new Error("Lock hook unresolved.")
    const distributor = params.distributor
    const lockHook = params.lockHook

    let root = params.root
    if (!root) {
      // Re-derive root + configurationId from the recipient's merkle proof — the
      // lock-hook claim is keyed off them. `fetchQuery` reuses the public
      // allocations cache, so this doesn't refetch on reopen.
      const allocations = await queryClient.fetchQuery(
        userAllocationsQueryOptions(acsClient, {
          address: params.recipientAddress,
          deploymentId: params.projectId,
        }),
      )
      const matched = allocations.byBatch[params.batch]
      if (!matched) throw new Error("Allocation not found.")
      const proof = ((matched.extra?.proof as Hash[] | undefined) ?? []) as Hash[]
      if (proof.length === 0) throw new Error("Missing merkle proof.")
      const amount = toBigInt(matched.allocation)
      root = computeMerkleRoot("evm", {
        proof,
        handler: params.recipientAddress,
        amount,
      }) as Hash
    }
    const configurationId = await getConfigurationIdAt(viemPublicClient, {
      distributor,
      root,
      index: 0,
    })

    // Chain already switched by the preflight; resolve a fresh post-switch wallet
    // client. The op returns an `EvmTxHandle`; `confirmTransaction` (baked with
    // `DEFAULT_ABI_REGISTRY`) waits for the receipt.
    const walletClient = await getWalletClient(config, { chainId: evmChainId })
    if (params.root && walletClient.account?.address.toLowerCase() !== params.recipientAddress.toLowerCase()) {
      throw new Error("Connect the allocation's recipient wallet to withdraw.")
    }
    const handle = await lockHookClaim(viemPublicClient, walletClient, {
      lockHook,
      distributor,
      root,
      configurationId,
      recipient: params.recipientAddress as Address,
    })
    const receipt = await confirmTransaction(handle, { publicClient: viemPublicClient })
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
