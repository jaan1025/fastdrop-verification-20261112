import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { decodeJwt, isTokenExpired, type ChainEcosystem, type DecodedJwt } from "../jwt"
// `ecosystemForAlg` is intra-package only (not on the curated `./jwt` surface), so
// it is imported from the grammar leaf directly.
import { ecosystemForAlg } from "../jwt/grammar"
import { API_KEY_STORAGE_KEY, persistedKeyStorage } from "../persisted-key"

// (internal — never exported) Private Jotai atoms holding the auth API key (JWT) +
// derived session state. One `decodedTokenAtom` does a single typed decode of the
// persisted token; username/authenticated/ecosystem all derive from it (one decode,
// one "malformed → signed out" definition, P7). The API key persists via the shared
// `persisted-key.ts` storage adapter so React and imperative reads share one codec
// (P2).

// The persisted JWT API key, backed by `persistedKeyStorage` (the shared codec)
// under `API_KEY_STORAGE_KEY`; `getOnInit: true` so the initial value reads from
// storage synchronously.
export const apiKeyAtom = atomWithStorage<string | null>(
  API_KEY_STORAGE_KEY,
  null,
  persistedKeyStorage,
  { getOnInit: true },
)

// Writable flag set true when the server reports a 401; server-authoritative (set
// by the `app-runtime` 401 bridge via `useSetSessionExpired`), never client-polled.
export const sessionExpiredAtom = atom(false)

// The single typed decode of `apiKeyAtom` (`decodeJwt`); null when no key or
// malformed. All derived auth atoms read from this (P7).
export const decodedTokenAtom = atom<DecodedJwt | null>((get) => {
  const apiKey = get(apiKeyAtom)
  return apiKey ? decodeJwt(apiKey) : null
})

// Username from the decoded payload `aud`; null when signed out/malformed.
export const usernameAtom = atom<string | null>((get) => get(decodedTokenAtom)?.payload.aud ?? null)

// True when a decoded token exists and is not expired; a malformed token reads as
// signed out. Re-checks expiry against the persisted token so wall-clock advances
// flip authentication off without a re-render of the storage atom.
export const isAuthenticatedAtom = atom<boolean>((get) => {
  const apiKey = get(apiKeyAtom)
  if (!apiKey) return false
  return !isTokenExpired(apiKey)
})

// The signed-in ecosystem from the decoded header `alg` (via the grammar table);
// null when signed out. Drives chain-aware wallet UI.
export const ecosystemAtom = atom<ChainEcosystem | null>((get) => {
  const alg = get(decodedTokenAtom)?.header.alg
  return alg ? ecosystemForAlg(alg) : null
})
