import { useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import type { PreparedPortalClaim } from "@repo/airdrop-app-shared/claim"
import { toBigInt } from "@repo/shared/utils"

import { useClaimArm } from "../flow/arms/claim-arm-context"
import { useClaimContext, type ClaimContext } from "../flow/hooks/use-claim-context"
import { canReviewClaim, readCampaignRoot, type CampaignRoot } from "../flow/live-claim"
import { claimDisplay, type ClaimBusy, type ClaimRuntimeProps } from "./claim-session"

export function LiveClaimSession({ children }: ClaimRuntimeProps) {
  const connection = useClaimArm().useConnection()
  const wallet = connection.address
  const ctx = useClaimContext({ address: wallet })
  const display = claimDisplay("live")
  const root = readCampaignRoot(import.meta.env.VITE_FASTDROP_ROOT)
  const batch = import.meta.env.VITE_TARGET_BATCH?.trim()

  if (!root || !batch || !ctx.chainId || ctx.targetBatch !== batch || ctx.isError) {
    return children({ ...display, phase: "unavailable", notice: "The campaign or wallet eligibility could not be verified." })
  }
  if (!wallet) return children({ ...display, phase: "connect", connect: connection.connect })
  if (ctx.isLoading) return children({ ...display, phase: "checking" })

  let allocation = 0n
  try {
    if (ctx.allocation) allocation = toBigInt(ctx.allocation)
  } catch {
    return children({ ...display, phase: "unavailable", notice: "The allocation could not be read." })
  }
  if (allocation <= 0n || !ctx.recipientAddress) {
    return children({ ...display, phase: "ineligible", wallet, disconnect: connection.disconnect })
  }

  // Discard any review as soon as the wallet, deployment or allocation changes.
  const scope = JSON.stringify([
    wallet, ctx.recipientAddress, ctx.addressHandler, ctx.organizationId, ctx.deployment,
    ctx.chainId, ctx.distributor, ctx.base, ctx.roles, batch, root, ctx.allocation,
  ])
  return (
    <EligibleClaimSession
      key={scope}
      ctx={ctx}
      root={root}
      wallet={wallet}
      allocation={allocation}
      disconnect={connection.disconnect}
    >
      {children}
    </EligibleClaimSession>
  )
}

function EligibleClaimSession({ ctx, root, wallet, allocation, disconnect, children }: ClaimRuntimeProps & {
  ctx: ClaimContext
  root: CampaignRoot
  wallet: string
  allocation: bigint
  disconnect: () => void
}) {
  const arm = useClaimArm()
  const decimals = arm.useDecimals(ctx)
  const consumption = arm.useConsumption(ctx, root)
  const claim = arm.useClaim(ctx, root, wallet)
  const lock = arm.useLock(ctx, root, wallet, consumption)
  const operation = useRef<ClaimBusy | null>(null)

  const review = useMutation({ mutationFn: claim.prepareClaim, retry: false })
  const claimTx = useMutation({ mutationFn: (quote: PreparedPortalClaim) => quote.submit(), retry: false })
  const withdrawal = useMutation({ mutationFn: lock.withdraw, retry: false })
  const busy = review.isPending ? "review" : claimTx.isPending ? "claim" : withdrawal.isPending ? "withdraw" : null
  const reviewed = review.data
  const canReview = canReviewClaim(allocation, consumption.consumed)
  const canConfirm = !busy && !claimTx.data && decimals !== undefined && !!reviewed && reviewed.claimable > 0n
  const canWithdraw = !busy && !lock.isError && (lock.position?.withdrawable ?? 0n) > 0n
  const finish = () => { operation.current = null }

  const receiptFor = (hash: string | undefined) => hash
    ? { hash, url: claim.getExplorerUrl(hash) || undefined }
    : undefined
  const clearReview = () => {
    if (operation.current) return
    claimTx.reset()
    review.reset()
  }

  let notice: string | undefined
  if (claimTx.isError) notice = "The claim was not confirmed. Review the amounts again before trying again."
  else if (withdrawal.isError) notice = "The withdrawal was not confirmed."
  else if (review.isError) notice = isReleasePending(review.error)
    ? "Nothing is available now. Check again after more tokens are released."
    : "We could not prepare the claim. Review it again to retry."
  else if (reviewed && decimals === undefined) notice = "Waiting for token units before submission."

  // The view gets amounts and receipts; the executable quote stays in the runtime.
  const publicQuote = reviewed && (({ submit: _submit, ...values }) => values)(reviewed)

  return children({
    ...claimDisplay("live", decimals),
    phase: "ready",
    busy,
    notice,
    wallet,
    recipient: ctx.recipientAddress ?? wallet,
    allocation,
    consumed: consumption.consumed,
    quote: publicQuote,
    receipt: receiptFor(claimTx.data),
    canReview,
    canConfirm,
    review: () => {
      if (!canReview || operation.current) return
      clearReview()
      operation.current = "review"
      review.mutate(undefined, { onSettled: finish })
    },
    confirm: () => {
      if (!reviewed || !canConfirm || operation.current) return
      operation.current = "claim"
      claimTx.mutate(reviewed, { onError: () => review.reset(), onSettled: finish })
    },
    clearReview,
    disconnect: () => { if (!operation.current) disconnect() },
    withdraw: () => {
      if (!canWithdraw || operation.current) return
      operation.current = "withdraw"
      withdrawal.mutate(undefined, { onSettled: finish })
    },
    lock: {
      position: lock.position,
      isLoading: lock.isLoading,
      isError: lock.isError,
      canWithdraw,
      receipt: receiptFor(withdrawal.data),
    },
  })
}

const isReleasePending = (error: Error) =>
  error.message === "Nothing has been released for this allocation yet." ||
  error.message === "Already claimed up to the currently released amount."
