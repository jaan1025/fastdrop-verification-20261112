import { createVersionedStorageEntry } from "./versioned-entry"

// Thin prefix-scoped cache facade preserving the legacy `createLocalStorageCache`
// shape, now built on top of `createVersionedStorageEntry` rather than
// re-implementing localStorage access (L3). Carries zero storage logic of its own.

export interface LocalStorageCache<T> {
  /** Read the value at `prefix+key` (null on miss/SSR/corrupt). */
  get(key: string): T | null
  /** Write the value (no-op on SSR). */
  set(key: string, value: T): void
  /** Remove the value (no-op on SSR). */
  clear(key: string): void
}

export const createLocalStorageCache = <T>(prefix: string): LocalStorageCache<T> => {
  const entryFor = (key: string) => createVersionedStorageEntry<T>(`${prefix}${key}`)

  return {
    get: (key: string) => entryFor(key).read(),
    set: (key: string, value: T) => entryFor(key).write(value),
    clear: (key: string) => entryFor(key).clear(),
  }
}
