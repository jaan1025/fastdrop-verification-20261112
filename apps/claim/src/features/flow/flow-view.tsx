import { lazy, Suspense, type ComponentType } from "react"
import type { ChainKind } from "@repo/acs-client/model"

import { claimDisplay, type ClaimRuntimeProps } from "~/features/claim/claim-session"
import { fastdropCampaignReady } from "~/lib/campaign-binding"
import { useDeploymentDispatch } from "./hooks/use-claim-context"
import { AcsProvider } from "./providers/acs-provider"
import { QueryProvider } from "./providers/query-provider"

const ARMS: Record<ChainKind, ComponentType<ClaimRuntimeProps>> = {
  evm: lazy(() => import("./arms/flow-evm")),
  solana: lazy(() => import("./arms/flow-solana")),
}

function FlowDispatch({ children }: ClaimRuntimeProps) {
  const { chainKind, isLoading, isError, isMismatch } = useDeploymentDispatch()
  const display = claimDisplay()
  if (isLoading) return children({ ...display, phase: "checking" })
  if (isError || isMismatch || !chainKind) {
    return children({ ...display, phase: "unavailable", notice: "The campaign could not be verified." })
  }
  const Arm = ARMS[chainKind]

  return (
    <Suspense fallback={children({ ...display, phase: "checking" })}>
      <Arm>{children}</Arm>
    </Suspense>
  )
}

export function FlowView({ children }: ClaimRuntimeProps) {
  if (!fastdropCampaignReady) {
    return children({ ...claimDisplay(), phase: "unavailable", notice: "The campaign is not ready." })
  }
  return (
    <QueryProvider>
      <AcsProvider>
        <FlowDispatch>{children}</FlowDispatch>
      </AcsProvider>
    </QueryProvider>
  )
}
