import type { Address, Rpc, SolanaRpcApi } from "@solana/kit"
import { bytesToHex, hexToBytes } from "@repo/shared/utils"
import { fetchBatchConfig, fetchClaimRoot } from "./fetch"
import { getBatchConfigPDA, getClaimRootPDA, getDistributorPDA } from "./pda"
import { buildClaimExtra } from "../strategies/claim-extra"
import { resolveHookConsumed } from "../strategies/hook-consumed"
import { computeSolanaRoot, solanaHandlerBytes } from "./merkle"
import { toUint8Array } from "@repo/chain-solana-kit/utils"
import { WAD_SOL } from "@repo/airdrop-base/scale"

export interface PrepareClaimExtraInput {
  rpc: Rpc<SolanaRpcApi>
  /** Distributor `base` seed. */
  base: Address
  /** Allocation `addressHandler` (raw — used to derive `handlerHash`). */
  addressHandler: string
  /** Total allocation in raw token units, as committed in the Merkle leaf. */
  amount: bigint
  /** This claim's `released - consumed` delta, used to size hook data. Defaults to `amount`. */
  claimable?: bigint
  /** Merkle proof from public `/allocations`. */
  proof: `0x${string}`[]
  /** Configuration index inside the claim root. Defaults to 0. */
  configurationIndex?: number
  /**
   * Penalty `claim_at` (unix seconds) threaded into `buildClaimExtra`. The single
   * clock read for the claim happens here at the orchestration edge; defaults to
   * the current second. On-chain the value is checked within ±60s.
   */
  claimAt?: bigint
}

export interface PrepareClaimExtraResult {
  /** Serialized `_extra` bytes. Pass the SAME bytes to `/admin/trigger_claim` AND `useDistributorClaimAdmin` so the backend's relay signature matches what the on-chain claim instruction verifies. */
  extra: Uint8Array
  /** Hex-encoded `_extra` for sending to the relay. */
  extraHex: `0x${string}`
  /** Handler hash bytes — the on-chain `handler` arg. */
  handlerBytes: Uint8Array
  configurator: Uint8Array
  rootBytes: Uint8Array
  distributorPda: Address
  claimRootPda: Address
  batchConfigPda: Address
}

/**
 * [golden-test] The ONE byte-identity producer for the merkle-distributor claim
 * `_extra` payload + its supporting PDAs. BOTH claim arms (portal `useDistributorClaim` and
 * admin `useDistributorClaimAdmin`) route through this so the bytes the backend relay signs
 * are byte-identical to what `distributor.claim` verifies on-chain — without it
 * the sig fails (analysis H3/M6). Handler hashing + root recompute come from the
 * single Solana arm in `./merkle` (base58-aware, on-chain-matching).
 */
export const prepareSolanaClaimExtra = async (
  input: PrepareClaimExtraInput,
): Promise<PrepareClaimExtraResult> => {
  const { rpc, base, addressHandler, amount, proof, claimable = amount } = input
  const configurationIndex = input.configurationIndex ?? 0
  const claimAt = input.claimAt ?? BigInt(Math.floor(Date.now() / 1000))

  const root = computeSolanaRoot({ proof, handler: addressHandler, amount })
  const rootBytes = hexToBytes(root)
  const handlerBytes = solanaHandlerBytes(addressHandler)

  const [distributorPda] = await getDistributorPDA(base)
  const [claimRootPda] = await getClaimRootPDA({
    distributor: distributorPda,
    root: rootBytes,
  })

  const claimRoot = await fetchClaimRoot(rpc, claimRootPda)
  if (!claimRoot || claimRoot.configurators.length === 0) {
    throw new Error("Claim root not found on-chain")
  }
  const configurator = toUint8Array(claimRoot.configurators[configurationIndex]!)

  const [batchConfigPda] = await getBatchConfigPDA({
    distributor: distributorPda,
    configurator,
  })
  const batchConfig = await fetchBatchConfig(rpc, batchConfigPda)
  if (!batchConfig) {
    throw new Error("Batch config not found on-chain")
  }

  // Predict each strategy's on-chain `consumed` (via the per-hook resolver) so
  // the fallback is sized by REAL consumption (`claimable - Σ consumed`) — only a
  // Penalty hook consumes less than its share. Mirrors the EVM admin arm.
  const strategies = await Promise.all(
    batchConfig.strategies.map(async (s) => ({
      ...s,
      consumed: await resolveHookConsumed(s.hookType, {
        rpc,
        share: (claimable * s.proportion) / WAD_SOL,
        claimAt,
        distributorPda,
        configurator,
      }),
    })),
  )

  const extra = buildClaimExtra({
    configuratorIndex: configurationIndex,
    strategies,
    fallbackHook: batchConfig.fallbackHook,
    claimable,
    claimAt,
  })

  return {
    extra,
    extraHex: bytesToHex(extra),
    handlerBytes,
    configurator,
    rootBytes,
    distributorPda,
    claimRootPda,
    batchConfigPda,
  }
}
