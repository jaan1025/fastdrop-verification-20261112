import type { AcsClient } from "../../../transport"
import { postRelay } from "./post-relay"

export interface WithdrawFeesParams {
  /** Defaults to the client's bound deployment. */
  deploymentId?: string
}

/**
 * Withdraw accrued distributor fees to the server-configured recipient. The
 * backend relays the on-chain transaction (the browser never signs it), so the
 * response is just the resulting tx hash — `0x…` on EVM, a base58 signature on
 * Solana, hence `string` (not `0x${string}`).
 */
export const withdrawFees = (client: AcsClient, params: WithdrawFeesParams = {}) =>
  postRelay<{ txHash: string }>(client, "/admin/relay/distributor/withdraw", params, "withdrawFees")
