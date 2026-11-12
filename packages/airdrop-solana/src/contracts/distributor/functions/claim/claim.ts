import {
  type Address,
  type AccountMeta,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type TransactionSigner,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  address as toAddress,
} from "@solana/kit"
import type { UiWallet } from "@wallet-standard/react"
import { hexToBytes } from "@repo/shared/utils"
import { fetchMerkleDistributor, fetchBatchConfig, fetchStreamPreset } from "../fetch"
import { getFeeConfigPDA, getPenaltyConfigPDA, getStreamPresetPDA } from "../pda"
import { HookType } from "../../generated/types/hookType"
import { CLIQUE_LOCK_PROGRAM_ADDRESS } from "../../../lock/generated/programs/cliqueLock"
import { deriveAta, getMintTokenProgram } from "@repo/chain-solana-kit/token"
import { LOCK_HOOK_COMPUTE_UNITS } from "../compute-units"
import { logger } from "@repo/chain-solana-kit/utils"
import { ensureTxFits } from "@repo/chain-solana-kit/transaction"
import { getLutCache, setLutCache } from "@repo/chain-solana-kit/transaction"
import { type SolanaTxHandle } from "@repo/chain-solana-kit/transaction"
import { sendTransaction } from "../../../../transaction/send"
import { buildClaimInstructions, buildClaimCacheKey } from "./build-claim-instructions"
import { prepareLockHookContext } from "../../strategies/lock/lock-hook-accounts"
import { buildPenaltyHookRemainingAccounts } from "../../strategies/penalty/penalty-accounts"

/**
 * The fully-resolved claim context both arms produce. The byte-critical fields
 * (`extra`, `sig`, `handler`, `proof`, `root`, PDAs) are produced ONCE upstream
 * by `prepareSolanaClaimExtra` so the portal arm never re-derives what the admin
 * arm computed (analysis H3/M6) — the divergent-PDA risk is gone.
 */
export interface DistributorClaimContext {
  rpc: Rpc<SolanaRpcApi>
  ws?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  wallet: UiWallet | null
  payer: TransactionSigner
  /** Resolved recipient wallet — the on-chain claimer. */
  recipient: Address
  base: Address
  /** Handler-hash bytes (the on-chain `handler` arg). */
  handler: Uint8Array
  /** Merkle root bytes (from the one producer). */
  root: Uint8Array
  /** Configurator bytes (from the one producer). */
  configurator: Uint8Array
  /** Distributor / claim-root / batch-config PDAs (from the one producer). */
  distributorPda: Address
  claimRootPda: Address
  batchConfigPda: Address
  /** Claim leaf inputs. */
  amount: bigint
  released: bigint
  proof: `0x${string}`[]
  /** Relay co-signature hex. */
  sig: `0x${string}`
  /** Byte-identical `_extra` from the one producer. */
  extra: Uint8Array
  /** Optional shared LUT used during tx-size compression. */
  commonLutAddress?: Address
  /** Allow on-chain LUT creation for an oversized claim. Defaults to true. */
  allowCreateLut?: boolean
}

/**
 * The shared 6-step claim pipeline (analysis H3): read the configured strategies →
 * resolve mint/vault/ATA → attach hook remaining accounts → build instructions →
 * LUT-fit (with the SquadsX per-attempt cache) → send + confirm. Both `useDistributorClaim`
 * (portal) and `useDistributorClaimAdmin` (admin) call this; they differ only in how they
 * produce the context (ACS+ToS vs caller-supplied), and BOTH derive their bytes
 * via `prepareSolanaClaimExtra`.
 */
export const distributorClaim = async (ctx: DistributorClaimContext): Promise<SolanaTxHandle> => {
  const {
    rpc,
    ws,
    wallet,
    payer,
    base,
    handler,
    root,
    configurator,
    distributorPda,
    claimRootPda,
    batchConfigPda,
    amount,
    released,
    proof,
    sig,
    extra,
    commonLutAddress,
    allowCreateLut,
  } = ctx

  const claimer = toAddress(ctx.recipient)

  // 1. Read the configured strategies.
  const batchConfig = await fetchBatchConfig(rpc, batchConfigPda)
  if (!batchConfig) throw new Error("Batch config not found")

  const lockCount = batchConfig.strategies.filter((s) => s.hookType === HookType.Lock).length
  if (lockCount > 1) {
    // All Lock indices in one claim would initialize the same stream and NFT PDAs.
    throw new Error("Multiple Lock strategies are not supported in a single claim")
  }

  // 2. Resolve mint / vault / source ATA.
  const distributor = await fetchMerkleDistributor(rpc, distributorPda)
  if (!distributor) throw new Error("Distributor not found")
  const { mint, vault } = distributor
  const tokenProgram = await getMintTokenProgram(rpc, mint)
  const fromAta = await deriveAta(vault, mint, tokenProgram)

  const [feeConfigPda] = await getFeeConfigPDA({
    distributor: distributorPda,
    root,
  })

  // 3. The program slices remaining accounts by strategy index, even though
  //    it executes the fallback last. Repeated addresses still occupy slots.
  const remainingAccounts: AccountMeta[] = []
  const hookSeeds = { distributor: distributorPda, configurator }
  for (const [index, { hookType, accountsCount }] of batchConfig.strategies.entries()) {
    let accounts: AccountMeta[]
    switch (hookType) {
      case HookType.Transfer:
        accounts = []
        break
      case HookType.Lock: {
        const [streamPresetPda] = await getStreamPresetPDA(hookSeeds)
        const preset = await fetchStreamPreset(rpc, streamPresetPda)
        if (!preset) throw new Error("Stream preset not found on-chain")
        if (preset.lockProgram !== CLIQUE_LOCK_PROGRAM_ADDRESS) {
          throw new Error(`Unsupported lock program in stream preset: ${preset.lockProgram}`)
        }
        accounts = await prepareLockHookContext({
          claimer,
          distributorPda,
          root,
          mint,
          vault,
          tokenProgram,
          configurator,
        })
        break
      }
      case HookType.Penalty: {
        const [penaltyConfigPda] = await getPenaltyConfigPDA(hookSeeds)
        accounts = buildPenaltyHookRemainingAccounts({ penaltyConfigPda })
        break
      }
      default:
        throw new Error(`Unsupported hook type at strategy ${index}: ${hookType}`)
    }
    if (accountsCount !== accounts.length) {
      throw new Error(
        `Strategy ${index} (${HookType[hookType]}) accountsCount is ${accountsCount}; expected ${accounts.length}`,
      )
    }
    remainingAccounts.push(...accounts)
  }

  // 4. Build the instruction set.
  const { instructions } = await buildClaimInstructions({
    rpc,
    payer,
    claimer,
    base,
    handler,
    proof: proof.map((p) => hexToBytes(p)),
    amount,
    released,
    sig: hexToBytes(sig),
    extra,
    root,
    distributorPda,
    claimRootPda,
    batchConfigPda,
    feeConfigPda,
    mint,
    vault,
    fromAta,
    tokenProgram,
    remainingAccounts: remainingAccounts.length ? remainingAccounts : undefined,
    computeUnitLimit: lockCount ? LOCK_HOOK_COMPUTE_UNITS : undefined,
  })

  const latestBlockhash = (await rpc.getLatestBlockhash().send()).value
  const baseMessage = appendTransactionMessageInstructions(
    instructions,
    setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      setTransactionMessageFeePayerSigner(payer, createTransactionMessage({ version: 0 })),
    ),
  )

  // 5. LUT-fit. The cached LUT is read-only — passed alongside the shared
  //    common LUT; `ensureTxFits` only creates a fresh one when allowed and
  //    the tx is still over the size limit. It refuses on-the-fly creation for
  //    multisig wallets (the ALT `recent_slot` window can't survive a Squads
  //    proposal cycle), falling back to the provided LUTs instead. A freshly
  //    created LUT is persisted for reuse on later attempts; the cache is
  //    never cleared (the per-user LUT stays valid across future claims).
  const cacheKey = buildClaimCacheKey(claimer, base, root)
  const cachedLutAddress = getLutCache(cacheKey) ?? undefined

  const { txMessage, extraLutAddress } = await ensureTxFits({
    baseMessage,
    rpc,
    rpcSubscriptions: ws,
    payer,
    wallet,
    lutAddresses: [commonLutAddress, cachedLutAddress].filter((a): a is Address => !!a),
    allowCreateLut,
  })

  if (extraLutAddress) {
    setLutCache(cacheKey, extraLutAddress)
  }

  // 6. Send (simulate → sign → broadcast). Confirmation is the caller's
  //    responsibility via `confirmTransaction` from `@repo/airdrop-solana/contracts`.
  const handle = await sendTransaction({
    rpc,
    rpcSubscriptions: ws,
    txMessage,
    wallet,
  })
  logger.warn("[claim] tx sent", { handle })

  return handle
}
