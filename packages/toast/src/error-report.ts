import { extractErrorMessage } from "@repo/shared/errors"

import { isExpectedError } from "./expected-errors"

// The pure decision at the heart of `toastError`: given any caught value, work
// out the user-safe message and whether an unexpected error should be captured
// to Sentry (yielding a reference event id). Sentry is injected so this is fully
// testable in node with no SDK and no DOM — the React glue in `toast.tsx` only
// wires the real `getClient`/`captureException` and renders the result.

export interface SentryPort {
  /** Truthy only when a Sentry client is initialized. Gates all capture. */
  getClient: () => unknown
  /** Sends the exception and returns the event id. */
  captureException: (error: unknown) => string
}

export interface ErrorReport {
  readonly message: string
  /** Present only when the error was captured (Sentry active + unexpected). */
  readonly eventId?: string
}

/**
 * Returns `null` for a falsy error (caller no-ops). Otherwise returns the
 * extracted message, plus an `eventId` iff Sentry is active AND the error is
 * unexpected. Expected errors and an absent Sentry client both skip capture.
 */
export const resolveErrorReport = (error: unknown, sentry: SentryPort): ErrorReport | null => {
  if (!error) return null

  const message = extractErrorMessage(error)

  const shouldCapture = !!sentry.getClient() && !isExpectedError(message)
  const eventId = shouldCapture ? sentry.captureException(error) : undefined

  return eventId ? { message, eventId } : { message }
}
