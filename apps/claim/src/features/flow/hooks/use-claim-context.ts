import { useMemo } from "react"
import { resolveChainKind } from "@repo/acs-client/model"
import { useDeployment, useUserAllocations } from "@repo/acs-client/react"
import { evmRole, solRole } from "@repo/airdrop-app-shared/lib"
import { type HookContracts } from "@repo/airdrop-evm/contracts"

import { appId, deployment as deploymentName, targetBatch } from "~/lib/env"
import { campaignSolanaBase, matchesCampaignDeployment } from "~/lib/fastdrop-mode"

// EVM / Solana address types are taken off the role accessors' return types —
// the app cannot import `viem` / `@solana/kit` directly (strict pnpm isolation
// keeps them in the kits' node_modules), and these are exactly the branded
// address types the claim facade expects.
type EvmAddress = NonNullable<ReturnType<typeof evmRole>>
type SolAddress = NonNullable<ReturnType<typeof solRole>>

// The dispatcher's read: resolves the deployment's chainKind for the lazy
// arm-selection, WITH the query state so the flow-view can tell "still resolving"
// (show the loader) from "resolved but unsupported chainKind" (show the error).
// `useDeployment` is keyed by app+name, so this dedupes with each step's full
// `useClaimContext` call below (no extra request). Chain-free — only the ACS
// deployment read + `resolveChainKind`; the ONE thing the arm-selection needs
// BEFORE any chain stack loads.
export const useDeploymentDispatch = () => {
  const query = useDeployment({ name: deploymentName() })
  return {
    chainKind: resolveChainKind(query.data?.chainId),
    chainId: query.data?.chainId,
    isLoading: query.isLoading,
    isError: query.isError,
    isMismatch: Boolean(query.data && !matchesCampaignDeployment(query.data.chainId, query.data.roles?.contract)),
  }
}

// The single data-resolution hook every claim step consumes. Env-seeded (appId +
// deployment name), it resolves — mono's `useAirdropInfoQuery → useDeploymentQuery
// → useTargetBatchQuery → useBatchDataQuery` chain, extended to both chains:
//
//   • deployment (chainId + roles) via `useDeployment({ name })`
//   • the chain-typed claim refs (distributor/base/hookContracts/commonLut) from
//     `roles`, mirroring vesting-portal's `buildPortalClaimChain`
//   • the exact batch bound at release via `VITE_TARGET_BATCH`
//   • the matched allocation row + `recipientAddress`
//     (`extra.recipient ?? addressHandler`, the value the on-chain probe keys off)
//
// It exposes ONE chain-free surface; the chain-specific claim/consumption/decimals
// hooks take the refs off it. `address` is threaded in (from the connected wallet)
// so every step reads the same account.

export interface ClaimContext {
  organizationId: string
  deployment: string
  chainId: string | undefined
  chainKind: ReturnType<typeof resolveChainKind>
  roles: Record<string, string> | undefined
  // Chain refs
  distributor?: EvmAddress
  lockHook?: EvmAddress
  hookContracts: HookContracts
  base?: SolAddress
  commonLut?: SolAddress
  // Target + allocation
  targetBatch: string | undefined
  allocation: string | undefined
  addressHandler: string | undefined
  proof: `0x${string}`[] | undefined
  recipientAddress: string | undefined
  // Query state (for the connect-step gate)
  isLoading: boolean
  isError: boolean
}

export interface UseClaimContextInput {
  /** Connected wallet address (EVM 0x… or Solana base58). */
  address: string | undefined
}

export const useClaimContext = ({ address }: UseClaimContextInput): ClaimContext => {
  const organizationId = appId()
  const deployment = deploymentName()

  const deploymentQuery = useDeployment({ name: deployment })
  const data = deploymentQuery.data
  const valid = matchesCampaignDeployment(data?.chainId, data?.roles?.contract)
  const chainId = valid ? data?.chainId : undefined
  const roles = valid ? data?.roles : undefined
  const chainKind = resolveChainKind(chainId)
  const resolvedTargetBatch = targetBatch()

  const allocationsQuery = useUserAllocations({
    address: valid && resolvedTargetBatch ? address : undefined,
    deploymentId: deployment,
  })

  const row = resolvedTargetBatch ? allocationsQuery.data?.byBatch[resolvedTargetBatch] : undefined
  const addressHandler = row?.addressHandler
  const recipientAddress = (row?.extra?.recipient as string | undefined) ?? addressHandler
  const proof = (row?.extra?.proof as `0x${string}`[] | undefined) ?? undefined

  const chainRefs = useMemo(() => {
    return {
      distributor: evmRole(roles, "contract"),
      lockHook: evmRole(roles, "lockHook"),
      hookContracts: {
        transfer: evmRole(roles, "transferHook"),
        lock: evmRole(roles, "lockHook"),
        linearPenalty: evmRole(roles, "linearPenaltyHook"),
        transferOrCoinFlip: evmRole(roles, "transferOrCoinFlipHook"),
        transferWithCap: evmRole(roles, "transferWithCapHook"),
      } as HookContracts,
      base: roles && campaignSolanaBase ? solRole({ contract: campaignSolanaBase }, "contract") : undefined,
      commonLut: solRole(roles, "lut"),
    }
  }, [roles])

  return {
    organizationId,
    deployment,
    chainId,
    chainKind,
    roles,
    ...chainRefs,
    targetBatch: resolvedTargetBatch,
    allocation: row?.allocation,
    addressHandler,
    proof,
    recipientAddress,
    isLoading: deploymentQuery.isLoading || allocationsQuery.isLoading,
    isError: deploymentQuery.isError || allocationsQuery.isError,
  }
}
