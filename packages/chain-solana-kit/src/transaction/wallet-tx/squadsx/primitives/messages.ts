import { type generated } from "@sqds/multisig"
import { formatError } from "../../../../errors"

/**
 * Squads proposal wait/timeout message catalog. Split out of the former
 * `squadsx/execution.ts` — pure string builders consumed by `execution.ts`.
 */

export type ProposalStatusKind = generated.ProposalStatus["__kind"]

export const buildTerminalMessage = (kind: "Rejected" | "Cancelled"): string => {
  if (kind === "Rejected") {
    return "The Squads proposal was rejected by the multisig members. Please retry from your Squads dashboard."
  }
  return "The Squads proposal was cancelled. Please retry from your Squads dashboard."
}

export const SQUADS_DASHBOARD_HINT =
  "Please approve and execute the proposal in your Squads dashboard, then try again."

export const buildTimeoutMessage = (
  lastStatus: ProposalStatusKind | undefined,
  lastError: unknown,
): string => {
  switch (lastStatus) {
    case "Draft":
      return `Timed out — the Squads proposal is still a draft. ${SQUADS_DASHBOARD_HINT}`
    case "Active":
      return `Timed out waiting for the Squads proposal to be approved. ${SQUADS_DASHBOARD_HINT}`
    case "Approved":
      return "Timed out waiting for the Squads proposal to be executed. The proposal has been approved — please execute it in your Squads dashboard, then try again."
    case "Executing":
      return "Timed out while the Squads proposal was still executing. Please check the transaction status in your Squads dashboard."
    case "Executed": {
      // Reached when the proposal is Executed but `getSignaturesForAddress`
      // kept failing until the polling window ran out.
      const detail = lastError ? ` (last error: ${formatError(lastError)})` : ""
      return `Timed out resolving the Squads proposal execution signature${detail}. Please check your Squads dashboard for the transaction.`
    }
    case undefined: {
      const detail = lastError ? ` (last error: ${formatError(lastError)})` : ""
      return `Timed out waiting for the Squads proposal to appear on chain${detail}. ${SQUADS_DASHBOARD_HINT}`
    }
    // `Rejected` and `Cancelled` are handled by the terminal branch and never
    // reach this function; fall through defensively in case the enum grows.
    default:
      return `Timed out waiting for the Squads proposal (last status: ${lastStatus}). ${SQUADS_DASHBOARD_HINT}`
  }
}
