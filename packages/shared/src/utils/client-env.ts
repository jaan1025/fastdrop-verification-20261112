// The single home for reading client-exposed env vars (the `VITE_*` surface).
//
// Under Vite/TanStack Start, client vars carry the `VITE_` prefix and Vite
// injects them on `import.meta.env`; node/vitest tooling exposes the same values
// on `process.env`. Every client `env.ts` across the repo had hand-copied this
// exact read-both + trim-to-undefined idiom — this leaf owns it once.
//
// STATIC-INLINING NOTE: Vite's static `import.meta.env.VITE_X` replacement only
// fires on a literal member access. Every copy here already read the var via a
// DYNAMIC bracket lookup (`env[key]`), so no per-key static inlining was ever in
// play — these apps run TanStack Start (SSR), where `import.meta.env` is a real
// object at runtime on both the server and the client. Taking the KEY is therefore
// safe and preserves the existing behavior exactly.

/**
 * Reads a client env var by key, consulting Vite's `import.meta.env` first and
 * falling back to `process.env` (node/vitest). Returns the raw value, or
 * `undefined` when the var is unset. No trimming — callers that want blank →
 * `undefined` normalization use {@link readTrimmedClientEnv}.
 */
export const readClientEnv = (key: string): string | undefined => {
  const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  return viteEnv?.[key] ?? globalThis.process?.env?.[key]
}

/**
 * Like {@link readClientEnv}, but trims the value and collapses a blank /
 * whitespace-only result to `undefined` — the "unset OR empty ⇒ off" convention
 * every client env module applies before defaulting.
 */
export const readTrimmedClientEnv = (key: string): string | undefined => {
  const trimmed = readClientEnv(key)?.trim()
  return trimmed ? trimmed : undefined
}
