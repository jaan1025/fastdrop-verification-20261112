import type { ClaimSession } from "~/features/claim/claim-session"

export const claimSteps = [
  { id: "connect", title: "Connect Wallet" },
  { id: "eligibility", title: "Check Eligibility" },
  { id: "action", title: "Claim Tokens" },
  { id: "complete", title: "Claim Success" },
] as const

export type ClaimStep = (typeof claimSteps)[number]["id"]
type ProgressSession = Pick<Extract<ClaimSession, { phase: "ready" }>, "phase" | "allocation" | "consumed" | "receipt"> |
  { phase: Exclude<ClaimSession["phase"], "ready"> }

export function claimStep(session: ProgressSession, continued: boolean): ClaimStep {
  if (!continued) return "connect"
  if (session.phase === "ineligible") return "eligibility"
  if (session.phase !== "ready") return "connect"
  return session.receipt || (session.consumed !== undefined && session.consumed >= session.allocation)
    ? "complete"
    : "action"
}
