import { type Address, type Hash, type PublicClient, parseAbiItem } from "viem"

/** The `AirdropClaimed(account, root, amount)` event — `account = onBehalfOf`. */
const AIRDROP_CLAIMED_EVENT = parseAbiItem(
  "event AirdropClaimed(address indexed account, bytes32 indexed root, uint256 amount)",
)

/**
 * Resolve the transaction hash of a recipient's claim by scanning the single
 * `AirdropClaimed` log at the block recorded in the on-chain claim status
 * (`claimed[root][handlerHash].lastClaimedBlock`). Filters by `account`
 * (the resolved `onBehalfOf` claimer, which the event is emitted with) over the
 * single `blockNumber`, and returns the first log's hash (`''` when none).
 */
export const getClaimedTransactionHash = async (
  publicClient: PublicClient,
  params: {
    distributor: Address
    /** Resolved claimer (`onBehalfOf`) — the `AirdropClaimed(account,…)` key. */
    recipient: Address
    /** The `lastClaimedBlock` from the claim status; single-block filter bound. */
    blockNumber: bigint
  },
): Promise<Hash | ""> => {
  const { distributor, recipient, blockNumber } = params
  const logs = await publicClient.getLogs({
    address: distributor,
    event: AIRDROP_CLAIMED_EVENT,
    args: { account: recipient },
    fromBlock: blockNumber,
    toBlock: blockNumber,
  })
  return logs[0]?.transactionHash ?? ""
}
