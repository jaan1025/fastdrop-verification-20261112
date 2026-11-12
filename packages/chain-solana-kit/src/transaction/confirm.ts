import { sleep } from "@repo/shared/utils"
import { logger } from "../utils/logger"
import {
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type Signature,
} from "@solana/kit"
import { formatRpcError } from "../errors"

export interface ConfirmParams {
  rpc: Rpc<SolanaRpcApi>
  rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  txSignature: Signature
  commitment?: "confirmed" | "finalized" | "processed"
  maxAttempts?: number
  interval?: number
}

/**
 * Wait for transaction confirmation via WebSocket subscription or HTTP polling.
 *
 * No `resolveProgramError` seam here on purpose: confirm passes `null` logs to
 * `formatRpcError`, and program-error decoding needs logs to
 * fire — so a resolver param would be a dead no-op.
 */
export const confirm = async (params: ConfirmParams): Promise<void> => {
  const {
    rpc,
    rpcSubscriptions,
    txSignature,
    commitment = "confirmed",
    maxAttempts = 30,
    interval = 3000,
  } = params

  if (rpcSubscriptions) {
    const abortController = new AbortController()
    // `null` = the subscription itself failed → fall through to HTTP polling.
    // A set value = the signature reached `commitment`, carrying its err
    // (null on success). A failed tx still emits a notification, so returning
    // unconditionally on the first event would report a reverted tx as
    // confirmed (fail-open).
    let result: { err: unknown } | null = null
    try {
      const notifications = await rpcSubscriptions
        .signatureNotifications(txSignature, { commitment })
        .subscribe({ abortSignal: abortController.signal })

      // First notification = the signature reached `commitment`.
      for await (const notification of notifications) {
        result = { err: notification.value.err }
        break
      }
    } catch (e) {
      logger.warn("Subscription confirmation failed, falling back to polling", e)
    } finally {
      abortController.abort()
    }
    if (result) {
      if (result.err) {
        throw new Error(`Transaction failed: ${formatRpcError(result.err, null)}`)
      }
      return
    }
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let status
    try {
      const res = await rpc.getSignatureStatuses([txSignature]).send()
      status = res.value[0]
    } catch (e) {
      logger.warn("[tx] confirmation poll failed, retrying", e)
      await sleep(interval)
      continue
    }

    if (status?.err) {
      throw new Error(`Transaction failed: ${formatRpcError(status.err, null)}`)
    }

    if (status?.confirmationStatus === commitment || status?.confirmationStatus === "finalized") {
      return
    }

    await sleep(interval)
  }

  throw new Error("Transaction confirmation timeout")
}
