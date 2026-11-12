// BYTE CONTRACT: this exact, ordered list decides which errors are "expected"
// (user rejection, network, rate-limit, auth, geo/VPN…) and therefore SKIP
// Sentry capture. Adding/removing/reordering a pattern changes what noise reaches
// Sentry vs what is silently swallowed — treat it as an API and pin it with the
// golden test. Substrings, case-insensitive.
export const EXPECTED_ERROR_PATTERNS = [
  "reject",
  "denied",
  "cancel",
  "unauthorized",
  "timed out",
  "connection failed",
  "is not a function",
  "too many requests",
  "not permitted",
  "disable your vpn",
] as const

const expectedErrorRe = new RegExp(EXPECTED_ERROR_PATTERNS.join("|"), "i")

/** True when the message matches a known-benign pattern (skip Sentry capture). */
export const isExpectedError = (message: string): boolean => expectedErrorRe.test(message)
