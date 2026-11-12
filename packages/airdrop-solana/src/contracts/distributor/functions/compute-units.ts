// Clique-specific compute-unit tuning constants. The generic compute-budget
// instruction builder (`getComputeBudgetInstructions`) lives in
// `@repo/chain-solana-kit/utils`; the Clique claim path passes these unit counts
// into it (DI seam, per the split _DECISIONS).

/** Compute units required when a claim executes the CliqueLock lock-hook. */
export const LOCK_HOOK_COMPUTE_UNITS = 400_000
