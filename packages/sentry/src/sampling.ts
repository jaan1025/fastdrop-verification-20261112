// Pure builders for the Sentry.init() option objects. Extracting them keeps the
// sampling contract (a deliberate policy, ported verbatim from mono) testable
// with golden equality, independent of the SDK and of env resolution.

export interface SamplingContext {
  /** True in dev (100% traces), false in prod (10% traces). */
  isDevelopment: boolean
}

export interface ClientInitOptions {
  dsn: string
  sendDefaultPii: boolean
  tracesSampleRate: number
  replaysSessionSampleRate: number
  replaysOnErrorSampleRate: number
}

export interface ServerInitOptions {
  dsn: string
  sendDefaultPii: boolean
  tracesSampleRate: number
}

/** 100% traces in development, 10% in production — one policy, both runtimes. */
const tracesSampleRate = (isDevelopment: boolean): number => (isDevelopment ? 1.0 : 0.1)

/**
 * Client (browser) init options. `sendDefaultPii` adds request headers + IP.
 * Session replay is explicitly disabled (both rates 0).
 */
export const buildClientInitOptions = (
  dsn: string,
  { isDevelopment }: SamplingContext,
): ClientInitOptions => ({
  dsn,
  sendDefaultPii: true,
  tracesSampleRate: tracesSampleRate(isDevelopment),
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
})

/**
 * Server (Node) init options. Same PII + sampling policy as the client; replay
 * options are never set server-side (mono set none).
 */
export const buildServerInitOptions = (
  dsn: string,
  { isDevelopment }: SamplingContext,
): ServerInitOptions => ({
  dsn,
  sendDefaultPii: true,
  tracesSampleRate: tracesSampleRate(isDevelopment),
})
