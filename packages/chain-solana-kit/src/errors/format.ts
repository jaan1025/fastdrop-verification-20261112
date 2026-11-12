import { isSolanaError } from "@solana/kit"
import { getSolanaErrorFromTransactionError } from "@solana/errors"
import { safeJSONStringify } from "@repo/shared/utils"
import { SolanaErrorMessages } from "./messages"
import {
  type ProgramErrorResolver,
  parseAnchorErrorFromLogs,
  parseProgramErrorFromLogs,
} from "./decode"

// ---------------------------------------------------------------------------
// Format — turn a caught error / RPC-response error into a USER MESSAGE.
// Parallel to the EVM kit's `errors/format.ts`; depends on `decode.ts`, never
// the reverse. Solana errors come from two sources:
//   1. RPC response errors — the RPC call succeeded (HTTP 200) but the tx
//      simulation/execution failed; arrive as JSON `value.err` + `value.logs`.
//      → `formatRpcError(err, logs)`
//   2. SDK exceptions — the RPC call itself failed / a client-side issue; thrown
//      as `SolanaError` with typed codes. → `formatError(error)`
// `toUserError(e)` wraps any caught error, preserving the original in `cause`.
// ---------------------------------------------------------------------------

/** Parse a raw RPC transaction error via the SDK decoder. */
const parseTransactionError = (err: unknown): string | null => {
  if (!err || (typeof err !== "string" && typeof err !== "object")) return null
  try {
    const solanaError = getSolanaErrorFromTransactionError(
      err as string | { [key: string]: unknown },
    )
    return formatError(solanaError)
  } catch {
    return null
  }
}

const NO_PROGRAM_RESOLVER: ProgramErrorResolver = () => null

/**
 * Last-resort stringify for an unknown error value that never surfaces a useless
 * `{}` (JSON.stringify of an Error has no enumerable own props) or
 * `[object Object]` (String of a plain object). Prefers a `.message`/`.error`
 * field, then a non-empty JSON, else a generic label.
 */
const stringifyUnknown = (e: unknown): string => {
  if (typeof e === "string") return e
  if (e instanceof Error) return e.message
  if (e && typeof e === "object") {
    const obj = e as Record<string, unknown>
    if (typeof obj.message === "string" && obj.message) return obj.message
    if (typeof obj.error === "string" && obj.error) return obj.error
    const json = safeJSONStringify(e)
    return json && json !== "{}" && json !== "null" ? json : "Unknown error"
  }
  return String(e)
}

/**
 * Resolve a raw RPC response error object into a human-readable message.
 * Tries: Anchor logs → program error code → SDK transaction decoder → raw.
 *
 * `resolveProgramError` is the DI seam for non-SPL (e.g. Clique) program maps;
 * when omitted, only the generic SPL-token map is consulted.
 */
export const formatRpcError = (
  err: unknown,
  logs: string[] | null,
  resolveProgramError: ProgramErrorResolver = NO_PROGRAM_RESOLVER,
): string =>
  parseAnchorErrorFromLogs(logs) ??
  parseProgramErrorFromLogs(logs, resolveProgramError) ??
  parseTransactionError(err) ??
  stringifyUnknown(err)

/** Resolve a caught Solana SDK exception into a user-friendly message. */
export const formatError = (error: unknown): string => {
  if (isSolanaError(error)) {
    const code = error.context.__code
    const override = SolanaErrorMessages[code]
    return `[${code}] ${override ?? error.message}`
  }
  return stringifyUnknown(error)
}

/** Wrap any caught error into a user-friendly Error with `cause` preserved. */
export const toUserError = (e: unknown): Error => new Error(formatError(e), { cause: e })
