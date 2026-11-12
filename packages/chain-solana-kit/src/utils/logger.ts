/**
 * The single injectable logger seam for `@repo/chain-solana-kit` (analysis M2/L8).
 *
 * Replaces the scattered `console.*` calls that previously lived in production
 * claim / signing / tx / LUT paths. Shipped code routes diagnostics through
 * `logger` rather than naming `console` directly, so an app can swap in its own
 * sink (or silence it) at the composition root via `setLogger`.
 *
 * The default sink is a no-op so the SDK is silent unless an app opts in — no
 * stray logs leak into a consumer's console.
 */
export interface Logger {
  warn: (message: string, context?: unknown) => void
  error: (message: string, context?: unknown) => void
}

const noopLogger: Logger = {
  warn: () => {},
  error: () => {},
}

let activeLogger: Logger = noopLogger

/** Inject the app's logger at the composition root. */
export const setLogger = (next: Logger): void => {
  activeLogger = next
}

/** The active logger seam consumed by shipped paths. */
export const logger: Logger = {
  warn: (message, context) => activeLogger.warn(message, context),
  error: (message, context) => activeLogger.error(message, context),
}
