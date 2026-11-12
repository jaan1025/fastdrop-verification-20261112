import { AccountRole, type Address, type AccountMeta } from "@solana/kit"
import { findAssociatedTokenPda, ASSOCIATED_TOKEN_PROGRAM_ADDRESS } from "@solana-program/token"
import { TOKEN_2022_PROGRAM_ADDRESS } from "@solana-program/token-2022"
import { SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system"
import { getStreamPDA, getNftBindingPDA } from "../../../lock/functions"
import { deriveStreamId } from "./stream-id"
import { CLIQUE_LOCK_PROGRAM_ADDRESS } from "../../../lock/generated/programs/cliqueLock"
import { getStreamPresetPDA, getNftMintPDA } from "../../functions/pda"

/**
 * The lock-hook remaining-accounts layout, as a NAMED ORDERED descriptor
 * (analysis M1). The order MUST match the on-chain `LockHook::execute` exactly;
 * expressing it as one named, length-asserted descriptor (rather than positional
 * `push`es) makes a layout drift fail loudly at build/test instead of
 * mis-signing on chain (the deploy doc already drifted 15 vs 12).
 */
export interface LockHookAccountInputs {
  streamPresetPda: Address
  streamPda: Address
  nftBindingPda: Address
  nftMint: Address
  nftTokenAccount: Address
  mint: Address
  streamTokenAccount: Address
  vault: Address
}

/** The expected number of lock-hook remaining accounts (asserted at build). */
export const LOCK_HOOK_ACCOUNT_COUNT = 12

export const buildLockHookRemainingAccounts = (inputs: LockHookAccountInputs): AccountMeta[] => {
  const accounts: AccountMeta[] = [
    { address: inputs.streamPresetPda, role: AccountRole.READONLY },
    { address: CLIQUE_LOCK_PROGRAM_ADDRESS, role: AccountRole.READONLY },
    { address: inputs.streamPda, role: AccountRole.WRITABLE },
    { address: inputs.nftBindingPda, role: AccountRole.WRITABLE },
    { address: inputs.nftMint, role: AccountRole.WRITABLE },
    { address: inputs.nftTokenAccount, role: AccountRole.WRITABLE },
    { address: inputs.mint, role: AccountRole.READONLY },
    { address: inputs.streamTokenAccount, role: AccountRole.WRITABLE },
    { address: TOKEN_2022_PROGRAM_ADDRESS, role: AccountRole.READONLY },
    { address: ASSOCIATED_TOKEN_PROGRAM_ADDRESS, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY },
    { address: inputs.vault, role: AccountRole.READONLY },
  ]

  if (accounts.length !== LOCK_HOOK_ACCOUNT_COUNT) {
    throw new Error(
      `Lock-hook remaining-accounts layout drift: expected ${LOCK_HOOK_ACCOUNT_COUNT}, got ${accounts.length}`,
    )
  }
  return accounts
}

export interface PrepareLockHookContextParams {
  claimer: Address
  distributorPda: Address
  root: Uint8Array
  mint: Address
  vault: Address
  tokenProgram: Address
  configurator: Uint8Array
}

/** Derive every lock-hook PDA, then assemble the ordered remaining accounts. */
export const prepareLockHookContext = async (
  params: PrepareLockHookContextParams,
): Promise<AccountMeta[]> => {
  const { claimer, distributorPda, root, mint, vault, tokenProgram, configurator } = params

  const [streamPresetPda] = await getStreamPresetPDA({
    distributor: distributorPda,
    configurator,
  })

  const streamId = deriveStreamId({ distributorPda, root, claimer })

  const [streamPda] = await getStreamPDA(streamId)
  const [nftBindingPda] = await getNftBindingPDA(streamId)
  const [nftMint] = await getNftMintPDA({ distributor: distributorPda, streamId })

  const [nftTokenAccount] = await findAssociatedTokenPda({
    mint: nftMint,
    owner: claimer,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
  })

  const [streamTokenAccount] = await findAssociatedTokenPda({
    mint,
    owner: streamPda,
    tokenProgram,
  })

  return buildLockHookRemainingAccounts({
    streamPresetPda,
    streamPda,
    nftBindingPda,
    nftMint,
    nftTokenAccount,
    mint,
    streamTokenAccount,
    vault,
  })
}
