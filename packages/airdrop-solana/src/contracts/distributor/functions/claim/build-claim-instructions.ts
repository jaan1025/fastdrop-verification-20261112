import {
  type Address,
  type Rpc,
  type SolanaRpcApi,
  type AccountMeta,
  type Instruction,
  type TransactionSigner,
} from "@solana/kit"
import { bytesToHex } from "@repo/shared/utils"
import { getComputeBudgetInstructions } from "@repo/chain-solana-kit/transaction"
import { ensureAta } from "@repo/chain-solana-kit/token"
import { getClaimInstructionAsync } from "../../generated/instructions/claim"

/** The fully-resolved inputs to the merkle-distributor claim instruction. */
export interface BuildClaimContext {
  rpc: Rpc<SolanaRpcApi>
  payer: TransactionSigner
  claimer: Address
  base: Address
  handler: Uint8Array
  proof: Uint8Array[]
  amount: bigint
  released: bigint
  sig: Uint8Array
  extra: Uint8Array
  root: Uint8Array
  distributorPda: Address
  claimRootPda: Address
  batchConfigPda: Address
  feeConfigPda: Address
  mint: Address
  vault: Address
  fromAta: Address
  tokenProgram: Address
}

export interface BuildClaimInstructionsParams extends BuildClaimContext {
  remainingAccounts?: AccountMeta[]
  computeUnitLimit?: number
}

/**
 * Assemble the claim instruction set: ATA-ensure (claimer) + the `claim`
 * instruction (with any hook remaining accounts appended) + compute budget. The
 * hook-specific remaining accounts + compute limit are computed upstream
 * (`lock-hook-accounts.ts` / `penalty-accounts.ts`) and passed in — this builder
 * only assembles.
 */
export const buildClaimInstructions = async (
  params: BuildClaimInstructionsParams,
): Promise<{ instructions: Instruction[] }> => {
  const { remainingAccounts, computeUnitLimit, ...ctx } = params

  const { ata: toAta, instruction: createAtaIx } = await ensureAta({
    rpc: ctx.rpc,
    owner: ctx.claimer,
    mint: ctx.mint,
    payer: ctx.payer.address,
    tokenProgram: ctx.tokenProgram,
  })

  const baseInstruction = await getClaimInstructionAsync({
    distributor: ctx.distributorPda,
    claimer: ctx.claimer,
    payer: ctx.payer,
    fromAta: ctx.fromAta,
    toAta,
    claimRoot: ctx.claimRootPda,
    feeConfig: ctx.feeConfigPda,
    batchConfig: ctx.batchConfigPda,
    base: ctx.base,
    tokenProgram: ctx.tokenProgram,
    handler: Array.from(ctx.handler),
    proof: ctx.proof.map((p) => Array.from(p)),
    amount: ctx.amount,
    released: ctx.released,
    sig: Array.from(ctx.sig),
    extra: ctx.extra,
  })

  const claimInstruction = remainingAccounts
    ? {
        ...baseInstruction,
        accounts: [...baseInstruction.accounts, ...remainingAccounts],
      }
    : baseInstruction

  const instructions: Instruction[] = []
  if (createAtaIx) instructions.push(createAtaIx)
  instructions.push(
    claimInstruction,
    ...getComputeBudgetInstructions(computeUnitLimit ? { units: computeUnitLimit } : undefined),
  )

  return { instructions }
}

/** Per-attempt LUT cache key for the SquadsX claim flow. */
export const buildClaimCacheKey = (claimer: Address, base: Address, root: Uint8Array): string =>
  `${claimer}:${base}:${bytesToHex(root)}`
