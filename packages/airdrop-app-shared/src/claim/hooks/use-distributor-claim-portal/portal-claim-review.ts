import {
  getClaimData,
  getUserAllocation,
  quoteClaimData,
  type QuoteClaimDataParams,
} from "@repo/acs-client/actions"
import { addressesMatch, type ChainKind } from "@repo/acs-client/model"
import type { AcsClient } from "@repo/acs-client/transport"
import { configurationClaimable, type Configuration } from "@repo/airdrop-base/distributor"
import { toBigInt } from "@repo/shared/utils"
import type { PreparedPortalClaim } from "../claim-hook-result"

type Hex = `0x${string}`
type ClaimRelease = Pick<PreparedPortalClaim, "allocation" | "released" | "consumed" | "claimable">
type ClaimDelivery = Pick<
  PreparedPortalClaim,
  "walletAmount" | "lockedAmount" | "forfeitedAmount" | "penaltyWindows"
>

export const REVIEW_MAX_AGE_SECONDS = 60n

function parseAmount(value: unknown, name: string): bigint {
  if (
    (typeof value === "string" && /^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)) ||
    (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
  ) {
    try {
      return toBigInt(value)
    } catch {
      // Noninteger amounts cannot be represented on chain.
    }
  }
  throw new Error(`Invalid ${name} amount.`)
}

function isProofNode(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[\da-fA-F]{64}$/.test(value)
}

export async function readPortalAllocation(
  client: AcsClient,
  input: {
    batch: string
    deploymentId: string
    address: string
    chainKind: ChainKind
    amountBits: number
  },
) {
  const { chainKind, amountBits, ...scope } = input
  const row = await getUserAllocation(client, scope)
  if (!row?.addressHandler) throw new Error("Allocation not found for this wallet.")
  if (!addressesMatch(chainKind, scope.address, row.extra?.recipient ?? row.addressHandler)) {
    throw new Error("Connect the wallet that matches the allocation recipient.")
  }
  const allocation = parseAmount(row.allocation, "allocation")
  if (allocation === 0n) throw new Error("Nothing is allocated to this wallet.")
  // Merkle encoders need the full leaf amount to fit the on-chain integer.
  if (BigInt.asUintN(amountBits, allocation) !== allocation) {
    throw new Error("The allocation amount is too large for this chain.")
  }
  const proof = row.extra?.proof
  if (!Array.isArray(proof) || !proof.every(isProofNode)) {
    throw new Error("Invalid allocation proof.")
  }
  return {
    allocation,
    addressHandler: row.addressHandler,
    proof: proof.map((node) => node.toLowerCase() as Hex),
  }
}

export function assertCampaignRoot(root: Hex, expectedRoot: Hex | undefined): void {
  if (expectedRoot !== undefined && root.toLowerCase() !== expectedRoot.toLowerCase()) {
    throw new Error("The allocation proof does not match the campaign root.")
  }
}

export async function resolveClaimRelease(params: {
  client: AcsClient
  scope: QuoteClaimDataParams
  allocation: bigint
  readConsumed: () => Promise<bigint>
}): Promise<ClaimRelease & { quotedAt: number }> {
  const { client, scope, allocation, readConsumed } = params
  const quotedAt = Date.now()
  const [quote, consumed] = await Promise.all([quoteClaimData(client, scope), readConsumed()])
  const released = parseAmount(quote.released, "released")
  if (consumed < 0n) throw new Error("Invalid consumed amount.")
  if (released > allocation) throw new Error("The released amount exceeds the allocation.")
  if (released === 0n) throw new Error("Nothing has been released for this allocation yet.")
  if (consumed >= released) throw new Error("Already claimed up to the currently released amount.")
  return { allocation, consumed, released, claimable: released - consumed, quotedAt }
}

export function evaluatePortalDelivery(
  configuration: Configuration,
  release: ClaimRelease,
  claimAt: bigint,
) {
  const { strategies, fallbackIndex } = configuration
  if (strategies.length === 0 || fallbackIndex < 0 || fallbackIndex > strategies.length) {
    throw new Error("Invalid claim strategy configuration.")
  }
  if (
    strategies.some(({ kind }) => !["transferHook", "lockHook", "linearPenaltyHook"].includes(kind))
  ) {
    throw new Error("Unsupported claim strategy.")
  }
  const lockCount = strategies.filter(({ kind }) => kind === "lockHook").length
  if (lockCount && (release.released < release.allocation || release.consumed > 0n)) {
    throw new Error("Partial claims are not supported for a batch with a lock strategy.")
  }
  if (lockCount > 1) throw new Error("Multiple lock strategies are not supported.")
  const penaltyWindows = strategies.flatMap(({ kind, penalty }) => {
    if (kind !== "linearPenaltyHook") return []
    if (!penalty) throw new Error("Penalty configuration not found on-chain.")
    if (penalty.beginTime === 0n && penalty.endTime === 0n) return []
    if (penalty.beginTime >= penalty.endTime) throw new Error("Invalid penalty window.")
    return [{ beginTime: penalty.beginTime, endTime: penalty.endTime }]
  })
  const { total, byStrategy } = configurationClaimable({
    configuration,
    amount: release.claimable,
    atUnix: claimAt,
  })
  if (
    total.consumed !== release.claimable ||
    total.claimed + total.locked + total.forfeited !== release.claimable
  ) {
    throw new Error("The strategy configuration does not consume the claimable amount.")
  }
  const delivery: ClaimDelivery = {
    walletAmount: total.claimed,
    lockedAmount: total.locked,
    forfeitedAmount: total.forfeited,
    penaltyWindows,
  }
  return { delivery, byStrategy }
}

export function claimReviewKey(value: unknown): string {
  return JSON.stringify(value, (_, part: unknown) =>
    typeof part === "bigint" ? part.toString() : part,
  )
}

export function prepareClaimReview<Wallet>(params: {
  client: AcsClient
  scope: QuoteClaimDataParams
  release: ClaimRelease & { quotedAt: number }
  delivery: ClaimDelivery
  extra: Hex
  beforeCoSign: () => void | Promise<void>
  validate: () => Promise<Wallet>
  send: (signature: Hex, wallet: Wallet) => Promise<string>
}): PreparedPortalClaim {
  const { client, scope, release, delivery, extra, beforeCoSign, validate, send } = params
  const { quotedAt, ...reviewedRelease } = release
  const assertNotExpired = () => {
    const age = Date.now() - quotedAt
    if (age < 0 || age >= Number(REVIEW_MAX_AGE_SECONDS) * 1000) {
      throw new Error("The claim review expired. Prepare a new claim.")
    }
  }
  let submitted = false
  return {
    ...reviewedRelease,
    ...delivery,
    async submit() {
      if (submitted) throw new Error("Prepare a new claim before submitting again.")
      submitted = true
      assertNotExpired()
      await beforeCoSign()
      assertNotExpired()
      const response = await getClaimData(client, { ...scope, extra })
      if (parseAmount(response?.released, "released") !== release.released) {
        throw new Error("The released amount changed. Prepare a new claim.")
      }
      const signature = response.sig
      if (!signature || !/^0x[\da-fA-F]{130}$/.test(signature)) {
        throw new Error("Invalid claim co-signature.")
      }
      assertNotExpired()
      const wallet = await validate()
      assertNotExpired()
      return send(signature, wallet)
    },
  }
}
