"use client"

// (internal) The local (localStorage) ToS-signature cache hook, keyed per
// resolved (address, identifier) via the payload-aware resolver. Wraps
// `@repo/shared/state`'s `usePersistMap`; the backing atom-family is private
// (L5). Replaces the legacy `useBaseToSSignatureStore` + the redundant
// getter-only `useBaseGetToSSignature` (the getter is just `.getItem`, derived
// at the call site).
import { usePersistMap } from "@repo/shared/state"

import type { ResolveStorageKey, ToSSignatureStore } from "../types"
import { resolveStorageKey } from "./resolve-key"

export const useToSSignatureStore = <
  Address extends string = string,
  Signature extends string = string,
  Payload = void,
>(options: {
  identifier: string
  storagePrefix: string
  lowercaseKeys?: boolean
  getStorageKey?: ResolveStorageKey<Address, Payload>
}): ToSSignatureStore<Address, Signature, Payload> => {
  const { identifier, storagePrefix, lowercaseKeys, getStorageKey } = options

  // The resolver already normalizes (lowercases) the key, so `usePersistMap`
  // sees an already-final key and must NOT lowercase again.
  const {
    getItem: rawGet,
    setItem: rawSet,
    removeItem: rawRemove,
    clear,
  } = usePersistMap({
    identifier: `${storagePrefix}-${identifier}`,
    lowercaseKeys: false,
  })

  // `payload` is threaded in by the caller (host write / ensure read) so BOTH
  // sites resolve the SAME key — e.g. the EVM resolver keys on `payload.chainId`;
  // omitting it on the read side caused a permanent cache miss.
  const resolve = (address: Address, payload?: Payload) =>
    resolveStorageKey<Address, Payload>({
      address,
      identifier,
      payload,
      lowercaseKeys,
      getStorageKey,
    })

  const getItem = async (address: Address, payload?: Payload) =>
    rawGet(await resolve(address, payload)) as Signature | undefined

  const setItem = async (address: Address, signature: Signature, payload?: Payload) => {
    rawSet(await resolve(address, payload), signature)
  }

  const removeItem = async (address: Address, payload?: Payload) => {
    rawRemove(await resolve(address, payload))
  }

  return { getItem, setItem, removeItem, clear }
}
