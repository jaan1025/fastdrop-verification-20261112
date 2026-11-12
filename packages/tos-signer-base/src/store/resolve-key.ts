// (internal) Pure, payload-aware cache-key resolution for the local
// ToS-signature store [golden-test]. Computes the localStorage entry key from
// address + identifier (+ optional custom resolver), with chain-aware
// lowercasing. The key is local-only and never sent to the backend, but its
// derivation must stay stable across refactors so cached consents survive
// (golden vectors pin the EVM-lowercased and Solana-verbatim forms). Zero deps.
import type { ResolveStorageKey } from "../types"

/**
 * [golden-test] The single, payload-aware resolver — the store can always see
 * every fact the host keys on (closes the legacy two-shape drift). Returns the
 * custom resolver's result when `getStorageKey` is provided (awaited; the
 * resolver may key on `payload` facts such as the EVM target chainId to avoid
 * chain-switch races), else falls back to the address. Lowercases when
 * `lowercaseKeys` is true (EVM) and leaves base58 verbatim otherwise (Solana).
 * Throws when the address is empty.
 */
export const resolveStorageKey = async <Address extends string = string, Payload = void>(input: {
  address: Address
  identifier: string
  payload?: Payload
  lowercaseKeys?: boolean
  getStorageKey?: ResolveStorageKey<Address, Payload>
}): Promise<string> => {
  const { address, identifier, payload, lowercaseKeys, getStorageKey } = input
  if (!address) {
    throw new Error("resolveStorageKey: address is required")
  }
  const resolved = (await getStorageKey?.({ address, identifier, payload })) || address
  return lowercaseKeys ? resolved.toLowerCase() : resolved
}
