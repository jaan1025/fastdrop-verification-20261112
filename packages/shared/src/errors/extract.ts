// Convert any caught error (Axios / Viem-Wagmi / Error / string / unknown) into
// a user-safe message, never leaking stack traces. Generic normalization — the
// Clique-specific geo/vpn/429 friendly-copy catalog is NOT here (it lives in
// `acs-client/transport`); these two functions are the chain-free,
// framework-light fallbacks every layer can use.

/**
 * Convert any caught error to a user-safe message string.
 *
 * Handles: Axios errors, Viem errors, tagged error objects (e.g. `AcsError`,
 * which is a plain `{ message, ... }` object and NOT an `Error` instance —
 * duck-typing the `message` field is the whole point), plain Errors, strings,
 * and unknown values. Never leaks stack traces or internal details to the user.
 *
 * `fallback` is returned only when nothing message-like can be found; for a
 * known-but-opaque condition (axios timeout / connection failure) the specific
 * copy still wins over `fallback`. Pass it to preserve a call site's
 * context-specific copy (e.g. "Unknown parse error.").
 */
export const extractErrorMessage = (
  error: unknown,
  fallback = "An unexpected error occurred.",
): string => {
  if (!error) return fallback

  const e = error as Record<string, unknown>

  // Viem / Wagmi — has shortMessage
  if (typeof e.shortMessage === "string") return e.shortMessage

  // Axios — fallback for requests not handled by createClient interceptor
  if (e.isAxiosError) {
    if (e.code === "ECONNABORTED") return "Request timed out. Please try again."
    if (e.response) {
      const res = e.response as { status: number; data: unknown }
      const msg = extractResponseMessage(res.data)
      if (msg) return msg
    }
    return "Connection failed. Check your internet and try again."
  }

  // Object with data.message (API response shape)
  if (typeof e.data === "object" && e.data !== null) {
    const msg = (e.data as Record<string, unknown>).message
    if (typeof msg === "string") return msg
  }

  // Object with message (Error, or error-like object)
  if (typeof e.message === "string" && e.message) return e.message

  // String
  if (typeof error === "string" && error) return error

  return fallback
}

export const extractResponseMessage = (data: unknown): string | null => {
  if (typeof data === "string" && data) return data
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>
    const msg = d.message ?? d.error ?? d.reason ?? d.cause
    if (typeof msg === "string" && msg) return msg
  }
  return null
}
