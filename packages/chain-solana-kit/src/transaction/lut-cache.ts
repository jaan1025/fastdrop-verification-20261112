import type { Address } from "@solana/kit"
import { createLocalStorageCache } from "@repo/shared/utils"

/**
 * Per-key LUT cache, persisted to localStorage. Use any stable key (claim id,
 * stake id, swap nonce, ...) — the same key across attempts reuses the same
 * LUT. Reads/writes are synchronous and safe to call from event handlers or
 * react-free flows.
 *
 * The cached value is the bare LUT `Address`, and entries are never cleared:
 * a per-user LUT stays valid for future contract interactions, so a created
 * LUT is reused (read-only) on later attempts and only replaced when a fresh
 * one is created.
 */
const cache = createLocalStorageCache<Address>("clique:solana:lut-cache:")

export const getLutCache = (key: string): Address | null => cache.get(key)

export const setLutCache = (key: string, lutAddress: Address): void => cache.set(key, lutAddress)
