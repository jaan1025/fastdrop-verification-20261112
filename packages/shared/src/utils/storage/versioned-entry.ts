import { isBrowser } from "../env"
import { safeJSONStringify } from "../json"

// The one localStorage primitive (L3): namespaced, typed, SSR-safe, optional
// TTL + schema-version gating, error-swallowing. Subsumes legacy `cache.ts`, the
// hand-rolled read/write/clear in `use-flow-state.ts`, and underpins the flow
// persistence adapter.

export interface VersionedStorageOptions {
  /** Max age before a stored value is treated as absent; omit to disable expiry. */
  ttlMs?: number
  /** Schema version; a stored value with a different version is discarded on read. */
  version?: number
}

export interface StorageEntry<T> {
  /** Parse + validate (version/TTL); returns null (and evicts) on
   *  corrupt/expired/version-mismatch; null (no evict) under SSR. */
  read(): T | null
  /** Best-effort write of a `{ v, ts, value }` envelope with the current
   *  timestamp; swallows quota/serialization errors; no-op under SSR. */
  write(value: T): void
  /** Remove the key; no-op under SSR. */
  clear(): void
  /** Read without evicting an expired/corrupt entry (diagnostic read). */
  peek(): T | null
}

/** On-disk wrapper carrying version + write timestamp. */
type StoredEnvelope<T> = { v: number; ts: number; value: T }

const isEnvelope = <T>(raw: unknown): raw is StoredEnvelope<T> =>
  typeof raw === "object" &&
  raw !== null &&
  typeof (raw as Record<string, unknown>).v === "number" &&
  typeof (raw as Record<string, unknown>).ts === "number" &&
  "value" in (raw as Record<string, unknown>)

export const createVersionedStorageEntry = <T>(
  key: string,
  options: VersionedStorageOptions = {},
): StorageEntry<T> => {
  const { ttlMs, version = 0 } = options

  const removeKey = () => {
    if (!isBrowser()) return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore — best-effort
    }
  }

  const parse = (evict: boolean): T | null => {
    if (!isBrowser()) return null
    let raw: string | null
    try {
      raw = window.localStorage.getItem(key)
    } catch {
      return null
    }
    if (!raw) return null
    try {
      const envelope = JSON.parse(raw) as unknown
      if (!isEnvelope<T>(envelope)) {
        if (evict) removeKey()
        return null
      }
      if (envelope.v !== version) {
        if (evict) removeKey()
        return null
      }
      if (ttlMs != null && Date.now() - envelope.ts > ttlMs) {
        if (evict) removeKey()
        return null
      }
      return envelope.value
    } catch {
      // Corrupt JSON — drop it so it can't shadow future entries.
      if (evict) removeKey()
      return null
    }
  }

  return {
    read: () => parse(true),
    peek: () => parse(false),
    write: (value: T) => {
      if (!isBrowser()) return
      try {
        const envelope: StoredEnvelope<T> = {
          v: version,
          ts: Date.now(),
          value,
        }
        window.localStorage.setItem(key, safeJSONStringify(envelope))
      } catch {
        // storage full / disabled — persistence is best-effort.
      }
    },
    clear: removeKey,
  }
}
