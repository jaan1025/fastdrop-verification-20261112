import { useState } from "react"

import { claimDisplay, type ClaimQuote, type ClaimRuntimeProps } from "./claim-session"

const UNIT = 1_000_000_000n
const DEMO_WALLET = "Demo wallet"
const sampleQuote = {
  allocation: 1000n * UNIT,
  released: 1000n * UNIT,
  consumed: 0n,
  claimable: 1000n * UNIT,
  walletAmount: 600n * UNIT,
  lockedAmount: 350n * UNIT,
  forfeitedAmount: 50n * UNIT,
  penaltyWindows: [],
} satisfies ClaimQuote

export default function DemoClaimRuntime({ children }: ClaimRuntimeProps) {
  const [connected, setConnected] = useState(false)
  const [stage, setStage] = useState<"allocation" | "review" | "receipt" | "used">("allocation")
  const [withdrawn, setWithdrawn] = useState(false)
  const display = claimDisplay("demo", 9)

  if (!connected) return children({ ...display, phase: "connect", connect: () => setConnected(true) })

  const claimed = stage === "receipt" || stage === "used"
  const disconnect = () => {
    setConnected(false)
    setStage("allocation")
    setWithdrawn(false)
  }

  return children({
    ...display,
    phase: "ready",
    wallet: DEMO_WALLET,
    recipient: DEMO_WALLET,
    allocation: sampleQuote.allocation,
    consumed: claimed ? sampleQuote.released : 0n,
    quote: stage === "review" || stage === "receipt" ? sampleQuote : undefined,
    receipt: stage === "receipt" ? { hash: "demo-claim" } : undefined,
    canReview: !claimed,
    canConfirm: stage === "review",
    review: () => { if (!claimed) setStage("review") },
    confirm: () => { if (stage === "review") setStage("receipt") },
    clearReview: () => setStage(claimed ? "used" : "allocation"),
    disconnect,
    withdraw: () => { if (claimed) setWithdrawn(true) },
    lock: {
      isLoading: false,
      isError: false,
      canWithdraw: claimed && !withdrawn,
      position: claimed ? {
        balance: (withdrawn ? 300n : 350n) * UNIT,
        withdrawable: (withdrawn ? 0n : 50n) * UNIT,
        startTime: 1794182400n,
        cliffTime: 1794182400n,
        endTime: 1801958400n,
      } : undefined,
      receipt: withdrawn ? { hash: "demo-withdrawal" } : undefined,
    },
  })
}
