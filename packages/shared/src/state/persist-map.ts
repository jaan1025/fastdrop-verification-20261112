import { useAtom } from "jotai"
import { atomFamily } from "jotai-family"
import { atomWithStorage, RESET } from "jotai/utils"
import { useCallback, useMemo, useRef } from "react"

// Hook providing a localStorage-persisted `Record<string,string>` map keyed by
// an identifier, with optional key-lowercasing; backed by a Jotai `atomFamily`
// of `atomWithStorage`. The atom-family is module-PRIVATE — only the hook is
// public (L5/§2.9).

export interface PersistMapOptions {
  /** Scopes the storage atom (storage key `clique:shared:map:${identifier}`). */
  identifier: string
  /** Lowercase keys on read/write (for case-insensitive address maps). */
  lowercaseKeys?: boolean
}

export interface PersistMap {
  /** The current map snapshot. */
  map: Record<string, string>
  /** Referentially-stable getter (applies lowercasing when enabled). */
  getItem(key: string): string | undefined
  /** Upsert (applies lowercasing; warns on empty key). */
  setItem(key: string, value: string): void
  /** Delete a key. */
  removeItem(key: string): void
  /** Reset the atom via `RESET`. */
  clear(): void
}

// Private — the atom-family never leaves the package.
const persistMapFamily = atomFamily((identifier: string) =>
  atomWithStorage<Record<string, string>>(`clique:shared:map:${identifier}`, {}, undefined, {
    getOnInit: true,
  }),
)

/** The one place key normalization happens. */
const normalizeKey = (key: string, lowercase: boolean): string =>
  lowercase ? key.toLowerCase() : key

export const usePersistMap = (options: PersistMapOptions | string): PersistMap => {
  const { identifier, lowercaseKeys = false } =
    typeof options === "string" ? { identifier: options } : options

  const atomInstance = persistMapFamily(identifier)
  const [map, setMap] = useAtom(atomInstance)

  const mapRef = useRef<typeof map>(map)
  mapRef.current = map

  const normalize = useMemo(
    () => (key: string) => normalizeKey(key, lowercaseKeys),
    [lowercaseKeys],
  )

  const getItem = useCallback(
    (key: string) => {
      if (!key) {
        console.warn("[usePersistMap.getItem] No key provided, identifier:", identifier)
        return
      }
      return mapRef.current[normalize(key)]
    },
    [identifier, normalize],
  )

  const setItem = useCallback(
    (key: string, value: string) => {
      if (!key) {
        console.warn("[usePersistMap.setItem] No key provided, identifier:", identifier)
        return
      }
      setMap((prev) => ({
        ...prev,
        [normalize(key)]: value,
      }))
    },
    [identifier, setMap, normalize],
  )

  const removeItem = useCallback(
    (key: string) => {
      if (!key) {
        console.warn("[usePersistMap.removeItem] No key provided, identifier:", identifier)
        return
      }
      const normalized = normalize(key)
      setMap((prev) => {
        const { [normalized]: _, ...rest } = prev
        return rest
      })
    },
    [identifier, setMap, normalize],
  )

  const clear = useCallback(() => {
    setMap(RESET)
  }, [setMap])

  return {
    map,
    getItem,
    setItem,
    removeItem,
    clear,
  }
}
