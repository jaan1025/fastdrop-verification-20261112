import { type Address, type PublicClient, parseAbiItem, toEventSelector } from "viem"

const STREAM_REVOKED_EVENT = parseAbiItem(
  "event StreamRevoked(address indexed caller, uint256 indexed streamId)",
)
const STREAM_CLAIMED_EVENT = parseAbiItem(
  "event StreamClaimed(address indexed claimer, uint256 indexed streamId, uint256 amount)",
)
const TRANSFER_TOPIC = toEventSelector(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
)

export interface EvmStreamRevocation {
  revoked: boolean
  /** Σ StreamClaimed amounts — what the recipient drew FROM THE LOCK STREAM
   * (includes the create-time auto-claim; `createStream` ends with `this.claim`).
   * For a 100%-lock config this is the full received total; a multi-strategy
   * config's immediate (non-lock) portion is NOT in here — use `refundedAmount`
   * (`received = allocation − refunded`) for the allocation-level truth. */
  claimedTotal: bigint
  /** The clawed-back remainder — the token `Transfer(lock → authority)` in the
   * revoke tx (`amount − claimedAmount` at revoke time). Undefined when the
   * receipt carries no such transfer (zero remainder emits none). */
  refundedAmount?: bigint
  /** Unix seconds of the revoke block. */
  revokedAt?: number
  caller?: Address
}

/**
 * CliqueLock deletes the stream record on BOTH full claim and revoke — state
 * reads cannot tell them apart. Both events index `streamId`, so a full-range
 * address+topic-filtered getLogs stays tiny (Alchemy allows an unlimited block
 * range when the response is small); on providers that reject wide ranges the
 * query throws and the caller degrades to the unknown state.
 */
export const getStreamRevocation = async (
  publicClient: PublicClient,
  params: { lock: Address; streamId: bigint },
): Promise<EvmStreamRevocation> => {
  const { lock, streamId } = params
  const [revokedLogs, claimedLogs] = await Promise.all([
    publicClient.getLogs({
      address: lock,
      event: STREAM_REVOKED_EVENT,
      args: { streamId },
      fromBlock: "earliest",
      toBlock: "latest",
    }),
    publicClient.getLogs({
      address: lock,
      event: STREAM_CLAIMED_EVENT,
      args: { streamId },
      fromBlock: "earliest",
      toBlock: "latest",
    }),
  ])
  const claimedTotal = claimedLogs.reduce((sum, log) => sum + (log.args.amount ?? 0n), 0n)
  const revokeLog = revokedLogs[0]
  if (!revokeLog) return { revoked: false, claimedTotal }
  const [block, receipt] = await Promise.all([
    publicClient.getBlock({ blockNumber: revokeLog.blockNumber }),
    publicClient.getTransactionReceipt({ hash: revokeLog.transactionHash }),
  ])
  // The refund is the only token transfer OUT of the lock in the revoke tx.
  // Parsed by topic layout (topic1 = 32-byte-padded `from`, data = value) — no
  // abi generics needed for the fixed ERC20 Transfer shape.
  let refundedAmount: bigint | undefined
  for (const log of receipt.logs) {
    if (log.topics[0] !== TRANSFER_TOPIC) continue
    const from = log.topics[1]
    if (!from || `0x${from.slice(26)}`.toLowerCase() !== lock.toLowerCase()) {
      continue
    }
    refundedAmount = BigInt(log.data)
    break
  }
  return {
    revoked: true,
    claimedTotal,
    refundedAmount,
    revokedAt: Number(block.timestamp),
    caller: revokeLog.args.caller,
  }
}
