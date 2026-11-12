import type { Address, Rpc, SolanaRpcApi } from "@solana/kit"
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS } from "@solana-program/token"
import { TOKEN_2022_PROGRAM_ADDRESS } from "@solana-program/token-2022"
import { SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system"
import { bytesToHex } from "@repo/shared/utils"
import { deriveAta, getMintTokenProgram } from "@repo/chain-solana-kit/token"
import { MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS } from "../../generated/programs/merkleDistributor"
import { CLIQUE_LOCK_PROGRAM_ADDRESS } from "../../../lock/generated/programs/cliqueLock"
import { HookType } from "../../generated/types/hookType"
import {
  getClaimRootPDA,
  getDistributorPDA,
  getFeeConfigPDA,
  getPenaltyConfigPDA,
  getStreamPresetPDA,
} from "../pda"
import { fetchMerkleDistributor } from "../fetch"
import { resolveConfigurators } from "../configurator"

/** Shared accounts contributed by a single claim root (keyed by root). */
export interface RootLutAccounts {
  claimRootPda: Address
  feeConfigPda: Address
}

/** Shared accounts contributed by a single configurator (keyed by configurator). */
export interface ConfiguratorLutAccounts {
  batchConfigPda: Address
  /** Present when the configurator carries a Lock strategy. */
  streamPresetPda?: Address
  /** Present when the configurator carries a Penalty strategy. */
  penaltyConfigPda?: Address
}

export interface ProjectLutInput {
  distributorPda: Address
  /** Distributor `base` seed. */
  base: Address
  mint: Address
  vault: Address
  /** `ATA(vault, mint, tokenProgram)` — the claim source ATA. */
  fromAta: Address
  /** Distribution token program (classic Token or Token-2022). */
  tokenProgram: Address
  roots: RootLutAccounts[]
  configurators: ConfiguratorLutAccounts[]
}

/**
 * The exact set of claim accounts that are SHARED across every batch and every
 * recipient of a Solana project — i.e. LUT-eligible. Per-recipient accounts
 * (claimer, to_ata, claim_status, stream, nft_*, stream_token_account) and the
 * signer are deliberately absent: they vary per claim and can never live in a
 * project-wide LUT. The output is deduped, insertion-ordered.
 *
 * Pure: given resolved inputs it derives nothing on-chain, so the membership
 * contract is unit-testable. `collectProjectLutAddresses` is the RPC orchestrator.
 */
export const buildProjectLutAddresses = (input: ProjectLutInput): Address[] => {
  const out: Address[] = [
    // Global constants — every claim touches these.
    MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS,
    CLIQUE_LOCK_PROGRAM_ADDRESS,
    SYSTEM_PROGRAM_ADDRESS,
    ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
    TOKEN_2022_PROGRAM_ADDRESS,
    // The distribution token program (may equal token-2022 → deduped below).
    input.tokenProgram,
    // Per-project — identical for every batch and every claimer.
    input.distributorPda,
    input.base,
    input.mint,
    input.vault,
    input.fromAta,
  ]
  for (const r of input.roots) {
    out.push(r.claimRootPda, r.feeConfigPda)
  }
  for (const c of input.configurators) {
    out.push(c.batchConfigPda)
    if (c.streamPresetPda) out.push(c.streamPresetPda)
    if (c.penaltyConfigPda) out.push(c.penaltyConfigPda)
  }
  return [...new Set(out)]
}

export interface CollectProjectLutAddressesParams {
  rpc: Rpc<SolanaRpcApi>
  /** Distributor `base` seed (the project's Solana base address). */
  base: Address
  /** Every batch's merkle root, as raw bytes (caller maps `0x…` → bytes). */
  roots: Uint8Array[]
}

/**
 * Resolve the full LUT-eligible address set for a project: read the distributor
 * (mint/vault), derive the source ATA, then per root derive claim-root/fee-config
 * and walk its configurators (on-chain `ClaimRoot.configurators[]` →
 * `BatchConfig.strategies`) to add batch-config + the hook account each strategy
 * needs (Lock → stream-preset, Penalty → penalty-config). Pure assembly is
 * delegated to `buildProjectLutAddresses`.
 */
export const collectProjectLutAddresses = async ({
  rpc,
  base,
  roots,
}: CollectProjectLutAddressesParams): Promise<Address[]> => {
  const [distributorPda] = await getDistributorPDA(base)
  const distributor = await fetchMerkleDistributor(rpc, distributorPda)
  if (!distributor) throw new Error("Distributor not found on-chain")

  const { mint, vault } = distributor
  const tokenProgram = await getMintTokenProgram(rpc, mint)
  const fromAta = await deriveAta(vault, mint, tokenProgram)

  // Dedupe roots so a repeated merkle root doesn't re-walk its configurators.
  const uniqueRoots = [...new Map(roots.map((r) => [bytesToHex(r), r])).values()]

  const rootAccounts: RootLutAccounts[] = []
  const configuratorAccounts: ConfiguratorLutAccounts[] = []

  for (const root of uniqueRoots) {
    const [claimRootPda] = await getClaimRootPDA({ distributor: distributorPda, root })
    const [feeConfigPda] = await getFeeConfigPDA({ distributor: distributorPda, root })
    rootAccounts.push({ claimRootPda, feeConfigPda })

    const configurators = await resolveConfigurators(rpc, distributorPda, claimRootPda)
    for (const info of configurators) {
      const hasLock = info.strategies.some((s) => s.hookType === HookType.Lock)
      const hasPenalty = info.strategies.some((s) => s.hookType === HookType.Penalty)
      const streamPresetPda = hasLock
        ? (
            await getStreamPresetPDA({
              distributor: distributorPda,
              configurator: info.configurator,
            })
          )[0]
        : undefined
      const penaltyConfigPda = hasPenalty
        ? (
            await getPenaltyConfigPDA({
              distributor: distributorPda,
              configurator: info.configurator,
            })
          )[0]
        : undefined
      configuratorAccounts.push({
        batchConfigPda: info.batchConfigPda,
        streamPresetPda,
        penaltyConfigPda,
      })
    }
  }

  return buildProjectLutAddresses({
    distributorPda,
    base,
    mint,
    vault,
    fromAta,
    tokenProgram,
    roots: rootAccounts,
    configurators: configuratorAccounts,
  })
}
