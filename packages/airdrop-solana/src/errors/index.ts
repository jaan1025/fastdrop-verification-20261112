// Clique error injection — the contracts side of the kit's program-error DI
// seam. The kit ships a generic `formatRpcError` that accepts a
// `ProgramErrorResolver`; this module owns the Clique Anchor program maps and
// binds them, so callers get Clique-aware decoding (falling back to the kit's
// generic SPL-token resolver for non-Clique programs).
import { formatRpcError } from "@repo/chain-solana-kit/errors"
import { CLIQUE_PROGRAM_ERROR_MESSAGES, resolveCliqueProgramError } from "./program-errors"

export { CLIQUE_PROGRAM_ERROR_MESSAGES, resolveCliqueProgramError }

/**
 * Format a raw Solana RPC response error with the Clique program-error maps
 * injected — the bound form of the kit's generic formatter.
 */
export const formatCliqueRpcError = (err: unknown, logs: string[] | null): string =>
  formatRpcError(err, logs, resolveCliqueProgramError)
