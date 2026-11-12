import { clearPersistedKey, readPersistedKey } from "./persisted-key"

// Imperative localStorage helpers for the persisted API key, usable outside a React
// tree (router guards in `_app.tsx`/`index.tsx`, imperative checks). Thin
// pass-throughs over the shared `persisted-key.ts` codec — no longer reaching into
// the Jotai layer for the key (P2 fixed). SSR-safe, framework-free.

// Reads the persisted API key via `readPersistedKey()`; SSR-safe and null-safe.
// Used by route guards to decide redirect-to-login before React mounts.
export const readPersistedApiKey = (): string | null => readPersistedKey()

// Clears the persisted API key via `clearPersistedKey()`; SSR-safe, swallows
// errors. Used by `useLogout`/`useLoginSuccessHandler` in `app-runtime`.
export const clearPersistedApiKey = (): void => clearPersistedKey()
