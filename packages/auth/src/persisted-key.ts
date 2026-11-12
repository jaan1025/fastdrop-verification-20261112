// (internal — not exported from any package entry point) The one home for the
// persisted-API-key storage contract: the localStorage key + the exact JSON
// read/write codec used by BOTH the Jotai `atomWithStorage` layer
// (`state/atoms.ts`) and the imperative SSR-safe layer (`storage.ts`). Extracting
// it fixes the legacy inversion where the framework-free `storage.ts` reached up
// into `atoms.ts` for the key (P2); the pure module is now below both. Pure,
// framework-free, SSR-safe (no `window` access at module scope).
//
// The codec is byte-identical to jotai's default `createJSONStorage()`: a string
// value persists as `JSON.stringify(value)` and reads back via `JSON.parse`, so
// existing persisted sessions keep working and the React/imperative reads share one
// provably-identical shape.

// `"clique:auth:api-key"`; the localStorage key for the persisted JWT. Single home
// (moved out of `atoms.ts`).
export const API_KEY_STORAGE_KEY = "clique:auth:api-key"

const safeLocalStorage = (): Storage | null => {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

// SSR-safe read: returns null when there is no `window`/`localStorage`; reads the
// raw value, JSON-parses it, and treats `"null"`/absent/parse-error as `null`. The
// shared read codec.
export const readPersistedKey = (): string | null => {
  const storage = safeLocalStorage()
  if (storage === null) return null
  try {
    const raw = storage.getItem(API_KEY_STORAGE_KEY)
    if (raw === null || raw === "null") return null
    return JSON.parse(raw) as string
  } catch {
    return null
  }
}

// SSR-safe write: JSON-stringifies and stores under the key (mirrors
// `atomWithStorage`'s serializer shape so React and imperative reads stay
// byte-identical).
export const writePersistedKey = (value: string | null): void => {
  const storage = safeLocalStorage()
  if (storage === null) return
  try {
    storage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // ignore
  }
}

// SSR-safe remove: deletes the key from localStorage; swallows errors.
export const clearPersistedKey = (): void => {
  const storage = safeLocalStorage()
  if (storage === null) return
  try {
    storage.removeItem(API_KEY_STORAGE_KEY)
  } catch {
    // ignore
  }
}

// A minimal `{ getItem, setItem, removeItem }` storage adapter suitable for passing
// to `atomWithStorage`, so the atom and the imperative helpers share one
// provably-identical codec. `getItem` returns the persisted value or the supplied
// `initialValue` when absent (the jotai contract).
export const persistedKeyStorage = {
  getItem: (_key: string, initialValue: string | null): string | null => {
    const value = readPersistedKey()
    return value === null ? initialValue : value
  },
  setItem: (_key: string, value: string | null): void => {
    writePersistedKey(value)
  },
  removeItem: (_key: string): void => {
    clearPersistedKey()
  },
}
