import { createContext, useContext, type ReactNode } from "react"
import { type ChainKind } from "@repo/acs-client/model"
import type { PreparedPortalClaim } from "@repo/airdrop-app-shared/claim"

import type { CampaignRoot } from "../live-claim"
import { type ClaimContext } from "../hooks/use-claim-context"

/** Wallet connect surface (mono's connect card wiring), one chain's arm. */
export interface ArmConnection {
  chainKind: ChainKind | undefined
  address: string | undefined
  connect: () => void
  disconnect: () => void
}

export interface ArmConsumption {
  consumed: bigint | undefined
  lastClaimedBlock?: bigint
}

export interface ArmClaim {
  prepareClaim: () => Promise<PreparedPortalClaim>
  getExplorerUrl: (hash: string) => string
}

export interface LockPosition {
  balance: bigint
  withdrawable: bigint | undefined
  startTime: bigint
  cliffTime: bigint
  endTime: bigint
}

export interface ArmLock {
  position: LockPosition | undefined
  isLoading: boolean
  isError: boolean
  withdraw: () => Promise<string>
}

export interface ClaimArm {
  useConnection: () => ArmConnection
  useConsumption: (ctx: ClaimContext, root: CampaignRoot) => ArmConsumption
  useDecimals: (ctx: ClaimContext) => number | undefined
  useClaim: (ctx: ClaimContext, root: CampaignRoot, wallet: string) => ArmClaim
  useLock: (
    ctx: ClaimContext,
    root: CampaignRoot,
    wallet: string,
    consumption: ArmConsumption,
  ) => ArmLock
}

const ClaimArmContext = createContext<ClaimArm | null>(null)

export const ClaimArmProvider = ({ arm, children }: { arm: ClaimArm; children: ReactNode }) => (
  <ClaimArmContext.Provider value={arm}>{children}</ClaimArmContext.Provider>
)

// Read the mounted arm. Throws if a step renders outside an arm — a wiring bug
// (the lazy dispatcher always wraps the steps in exactly one arm).
export const useClaimArm = (): ClaimArm => {
  const arm = useContext(ClaimArmContext)
  if (!arm) throw new Error("useClaimArm must be used inside a flow arm (flow-evm / flow-solana).")
  return arm
}
