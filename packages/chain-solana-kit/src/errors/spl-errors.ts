/**
 * Generic SPL-token program error map + resolver. These are the standard
 * SPL Token / Token-2022 program error codes (chain-generic, not Clique).
 *
 * Clique per-program (CliqueLock / MerkleDistributor) Anchor maps are NOT here —
 * they live in `@repo/airdrop-solana` and are injected into the
 * formatter via the `resolveProgramError` seam (see `format.ts`).
 */
export const SPL_TOKEN_PROGRAM_ADDRESSES = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
])

export const SPL_TOKEN_ERRORS: Record<number, string> = {
  0: "Account does not meet rent-exempt threshold",
  1: "Insufficient token balance",
  2: "Invalid mint",
  3: "Mint mismatch — account not associated with this mint",
  4: "Token account owner mismatch",
  5: "Fixed supply — cannot mint more tokens",
  6: "Account already in use",
  9: "Token account is not initialized",
  13: "Invalid account state",
  14: "Arithmetic overflow",
  17: "Account is frozen",
}

/**
 * Resolve a known SPL-token error message from the program address + code.
 * Returns `null` for non-SPL programs — those are resolved by the injected
 * `resolveProgramError` seam supplied at the call site.
 */
export const resolveSplTokenError = (programAddress: string, errorCode: number): string | null => {
  if (SPL_TOKEN_PROGRAM_ADDRESSES.has(programAddress)) {
    return SPL_TOKEN_ERRORS[errorCode] ?? null
  }
  return null
}
