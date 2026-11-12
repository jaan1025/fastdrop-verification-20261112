import { resolveSplTokenError } from "./spl-errors"

/**
 * The chain-generic DI seam type for ANY program-error decoder: resolves a known
 * program error message from `(programAddress, errorCode)`, or `null` if unknown.
 * Contracts inject a resolver wrapping their Anchor maps; the formatter falls
 * back to the generic SPL resolver when none is supplied. Program-error decoding
 * is DEPENDENCY-INJECTED — the kit ships only the generic SPL-token resolver;
 * callers that know specific (Clique) Anchor programs pass a `resolveProgramError`
 * wrapping their per-program maps, keeping the kit free of any contracts import.
 */
export type ProgramErrorResolver = (programAddress: string, errorCode: number) => string | null

// ---------------------------------------------------------------------------
// Decode — parse the failing error out of raw simulation logs. No final message
// assembly / wrapping (that's `format.ts`). Parallel layer to the EVM kit's
// `errors/decode.ts` (which decodes revert calldata against ABIs).
// ---------------------------------------------------------------------------

// Capture the FULL message to end-of-line, not up to the first period — Anchor
// messages are routinely multi-sentence (e.g. "Nothing available to claim.
// Please try later."). One AnchorError per log line, so `$` is the boundary.
const ANCHOR_ERROR_RE =
  /AnchorError.*?Error Code: ([^.]+)\. Error Number: (\d+)\. Error Message: (.+?)\.?\s*$/

/** Parse an Anchor error from simulation logs. */
export const parseAnchorErrorFromLogs = (logs: string[] | null): string | null => {
  if (!logs) return null
  // Pass 1 — prefer the STRUCTURED AnchorError anywhere in the logs, so a benign
  // earlier `Program log: Error: …` from a prior instruction can't shadow it.
  for (const log of logs) {
    const anchorMatch = log.match(ANCHOR_ERROR_RE)
    if (anchorMatch) {
      const [, code, number, message] = anchorMatch
      return `${code} (${number}): ${message}`
    }
  }
  // Pass 2 — only when no structured AnchorError exists, fall back to a generic
  // `Error: …` line.
  for (const log of logs) {
    const genericMatch = log.match(/Error: (.+)/)
    if (genericMatch?.[1]) return genericMatch[1]
  }
  return null
}

const PROGRAM_FAILURE_RE = /Program (\w+) failed: custom program error: 0x([0-9a-fA-F]+)/

/** Extract the failing program + custom error code from simulation logs. */
export const parseProgramErrorFromLogs = (
  logs: string[] | null,
  resolveProgramError: ProgramErrorResolver,
): string | null => {
  if (!logs) return null

  const failures: Array<{
    index: number
    programAddress: string
    errorCode: number
  }> = []

  for (let i = logs.length - 1; i >= 0; i--) {
    const match = logs[i]!.match(PROGRAM_FAILURE_RE)
    if (!match) continue
    const programAddress = match[1]!
    const errorCode = parseInt(match[2]!, 16)
    const known =
      resolveProgramError(programAddress, errorCode) ??
      resolveSplTokenError(programAddress, errorCode)
    if (known) return known
    failures.push({ index: i, programAddress, errorCode })
  }

  if (failures.length === 0) return null

  // Deterministic, non-misleading default. (We deliberately do NOT surface the
  // adjacent `logs[index-1]` line — for an unknown program that line is
  // unvalidated guesswork, not reliably the error cause.)
  const innermost = failures[failures.length - 1]!
  return `Program ${innermost.programAddress} error (code ${innermost.errorCode})`
}
