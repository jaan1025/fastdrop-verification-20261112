import { AccountRole, type Address, type AccountMeta } from "@solana/kit"

/** The penalty-hook remaining account (the penalty-config PDA, read-only). */
export const buildPenaltyHookRemainingAccounts = (params: {
  penaltyConfigPda: Address
}): AccountMeta[] => [{ address: params.penaltyConfigPda, role: AccountRole.READONLY }]
