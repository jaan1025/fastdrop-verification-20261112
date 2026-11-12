import type { ProgramErrorResolver } from "@repo/chain-solana-kit/errors"
import { CLIQUE_LOCK_PROGRAM_ADDRESS } from "../contracts/lock/generated/programs/cliqueLock"
import { MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS } from "../contracts/distributor/generated/programs/merkleDistributor"

/**
 * Per-program (CliqueLock / MerkleDistributor) Anchor error-code → message maps.
 *
 * This is the Clique-specific injected data for the kit's generic Solana error
 * formatter: `@repo/chain-solana-kit/utils`'s `formatRpcError`
 * accepts a `ProgramErrorResolver` (the DI seam). The kit already resolves the
 * generic SPL-token program codes internally; this module only carries the
 * Clique Anchor program maps and is passed in at the contracts call sites.
 */
export const CLIQUE_PROGRAM_ERROR_MESSAGES: Record<string, Record<number, string>> = {
  [CLIQUE_LOCK_PROGRAM_ADDRESS]: {
    6000: "Invalid vesting schedule parameters",
    6001: "Nothing available to claim — tokens have not started vesting or have already been claimed",
    6002: "Claim amount must be greater than zero",
    6003: "NFT ownership verification failed",
    6004: "Invalid NFT mint",
    6005: "NFT holder token account is required for this stream",
    6006: "Recipient does not match NFT holder",
    6007: "NFT account is frozen — claiming is not allowed",
    6008: "Invalid vault authority",
    6009: "Invalid unlock percentage — each must be ≤ 100% and their sum must not exceed 100%",
    6010: "NFT-bound stream revocation requires NftBinding account",
  },
  [MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS]: {
    6000: "Invalid handler",
    6001: "Invalid Merkle proof — your allocation data may be outdated, please refresh and try again",
    6002: "Invalid signature — please reconnect your wallet and try again",
    6003: "This allocation has already been claimed",
    6004: "Your wallet is not authorized for this action",
    6005: "Token account owner mismatch",
    6006: "Claims are currently paused",
    6007: "The distributor is not active",
    6008: "Fee configuration not set — please contact support",
    6009: "Arithmetic overflow",
    6010: "Invalid claim root",
    6011: "Hook data length does not match the number of strategies",
    6012: "Total consumed amount does not match the expected amount",
    6013: "Insufficient allocation for fallback hook",
    6014: "Allocation mismatch — please refresh and try again",
    6015: "Vesting hook execution failed",
    6016: "Invalid batch configuration",
    6017: "Too many strategies in batch configuration",
    6018: "Invalid strategy proportion",
    6019: "Invalid fallback hook index",
    6020: "Insufficient remaining accounts for hook execution",
    6021: "Invalid stream preset account",
    6022: "Invalid lock program",
    6023: "Invalid token program",
    6024: "Invalid associated token program",
    6025: "Invalid system program",
    6026: "Invalid vault account",
    6027: "Account is not mutable",
    6028: "Invalid NFT mint PDA address",
    6029: "Invalid configurator index",
    6030: "Empty configurators list",
    6031: "Invalid penalty configuration",
    6032: "Invalid timestamp",
  },
}

/**
 * Clique program-error resolver — the value injected into the kit formatter's
 * `ProgramErrorResolver` seam. Returns the known message for a
 * `(programAddress, errorCode)` pair, or `null` for non-Clique programs (the kit
 * then falls back to its generic SPL-token resolver).
 */
export const resolveCliqueProgramError: ProgramErrorResolver = (programAddress, errorCode) =>
  CLIQUE_PROGRAM_ERROR_MESSAGES[programAddress]?.[errorCode] ?? null
