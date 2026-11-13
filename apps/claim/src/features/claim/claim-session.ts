import type { ReactNode } from "react"
import type { PreparedPortalClaim } from "@repo/airdrop-app-shared/claim"
import { config } from "@repo/config"

import type { LockPosition } from "../flow/arms/claim-arm-context"
import { formatClaimAmount } from "../flow/live-claim"

export type ClaimQuote = Omit<PreparedPortalClaim, "submit">
export type ClaimReceipt = { hash: string; url?: string }
export type ClaimBusy = "review" | "claim" | "withdraw"

interface ClaimDisplay {
  tokenName: string
  tokenSymbol: string
  amount: (value: bigint) => string
  busy: ClaimBusy | null
  notice?: string
}

export type ClaimSession = ClaimDisplay & (
  | { phase: "checking" | "unavailable" }
  | { phase: "connect"; connect: () => void }
  | { phase: "ineligible"; wallet: string; disconnect: () => void }
  | {
      phase: "ready"
      wallet: string
      recipient: string
      allocation: bigint
      consumed?: bigint
      quote?: ClaimQuote
      receipt?: ClaimReceipt
      canReview: boolean
      canConfirm: boolean
      review: () => void
      confirm: () => void
      clearReview: () => void
      disconnect: () => void
      withdraw: () => void
      lock: {
        position?: LockPosition
        isLoading: boolean
        isError: boolean
        canWithdraw: boolean
        receipt?: ClaimReceipt
      }
    }
)

export interface ClaimRuntimeProps {
  children: (session: ClaimSession) => ReactNode
}

export function claimDisplay(decimals?: number): ClaimDisplay {
  const tokenSymbol = config.token.symbol || "tokens"
  return {
    tokenSymbol,
    tokenName: config.token.name || tokenSymbol,
    busy: null,
    amount: (value) =>
      decimals === undefined
        ? formatClaimAmount(value, decimals)
        : `${formatClaimAmount(value, decimals)} ${tokenSymbol}`,
  }
}
