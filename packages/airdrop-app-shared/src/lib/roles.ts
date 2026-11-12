import type { Address as EvmAddress } from "viem"
import type { Address as SolAddress } from "@repo/chain-solana-kit/config"
import {
  isEvmAddress,
  isSolanaAddressFormat,
  normalizeEvmAddress,
  type RoleKey,
} from "@repo/acs-client/model"

// Typed accessors for the ACS deployment `roles` map. Keys are a fixed
// vocabulary (`RoleKey`); values are chain-specific addresses. These three
// readers are the ONLY sanctioned way to pull an address out of `roles` — they
// replace the ad-hoc `roles["x"] as Address` casts scattered across features and
// turn a mistyped key into a compile error. `evmRole` additionally enforces the
// EVM-lowercasing invariant (the brand carries it forward).

type Roles = Partial<Record<RoleKey, string>> | undefined

/** EVM role address: format-validated and lowercased. `undefined` if absent/invalid. */
export const evmRole = (roles: Roles, key: RoleKey): EvmAddress | undefined => {
  const raw = roles?.[key]
  return raw && isEvmAddress(raw) ? (normalizeEvmAddress(raw) as EvmAddress) : undefined
}

/** Solana role address: base58 format-validated. Never lowercased. */
export const solRole = (roles: Roles, key: RoleKey): SolAddress | undefined => {
  const raw = roles?.[key]
  return raw && isSolanaAddressFormat(raw) ? (raw as SolAddress) : undefined
}

/** Raw, chain-agnostic role string — for presence checks and display. */
export const role = (roles: Roles, key: RoleKey): string | undefined => roles?.[key]
