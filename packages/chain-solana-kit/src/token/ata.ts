import {
  AccountRole,
  type Address,
  type Instruction,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit"
import { SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system"
import { findAssociatedTokenPda, ASSOCIATED_TOKEN_PROGRAM_ADDRESS } from "@solana-program/token"

/**
 * Get the token program that owns a mint account.
 * Returns TOKEN_PROGRAM_ADDRESS or TOKEN_2022_PROGRAM_ADDRESS.
 */
export const getMintTokenProgram = async (
  rpc: Rpc<SolanaRpcApi>,
  mint: Address,
): Promise<Address> => {
  const account = await rpc
    .getAccountInfo(mint, { commitment: "confirmed", encoding: "base64" })
    .send()
  if (!account?.value?.owner) {
    throw new Error("Mint account not found")
  }
  return account.value.owner
}

export const deriveAta = async (
  owner: Address,
  mint: Address,
  tokenProgram: Address,
): Promise<Address> => {
  const [ata] = await findAssociatedTokenPda({
    mint,
    owner,
    tokenProgram,
  })
  return ata
}

export const checkAtaExists = async (rpc: Rpc<SolanaRpcApi>, ata: Address): Promise<boolean> => {
  const account = await rpc
    .getAccountInfo(ata, { commitment: "confirmed", encoding: "base64" })
    .send()
  return Boolean(account?.value)
}

export const buildCreateAtaInstruction = (params: {
  ata: Address
  owner: Address
  mint: Address
  payer: Address
  tokenProgram: Address
}): Instruction => {
  const { ata, owner, mint, payer, tokenProgram } = params
  return {
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
    accounts: [
      { address: payer, role: AccountRole.WRITABLE_SIGNER },
      { address: ata, role: AccountRole.WRITABLE },
      { address: owner, role: AccountRole.READONLY },
      { address: mint, role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY },
      { address: tokenProgram, role: AccountRole.READONLY },
    ],
    data: new Uint8Array(),
  }
}

export const ensureAta = async (params: {
  rpc: Rpc<SolanaRpcApi>
  owner: Address
  mint: Address
  payer?: Address
  tokenProgram: Address
}): Promise<{
  ata: Address
  instruction: Instruction | null
}> => {
  const { rpc, owner, mint, payer, tokenProgram } = params
  const ata = await deriveAta(owner, mint, tokenProgram)
  const exists = await checkAtaExists(rpc, ata)

  if (exists) {
    return { ata, instruction: null }
  }

  const instruction = buildCreateAtaInstruction({
    ata,
    owner,
    mint,
    payer: payer ?? owner,
    tokenProgram,
  })

  return { ata, instruction }
}
