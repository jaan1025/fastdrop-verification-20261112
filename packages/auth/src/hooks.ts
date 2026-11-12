import { useAtomValue, useSetAtom } from "jotai"
import type { ChainEcosystem } from "./jwt"
import {
  apiKeyAtom,
  ecosystemAtom,
  isAuthenticatedAtom,
  sessionExpiredAtom,
  usernameAtom,
} from "./state/atoms"

// Thin React hook wrappers over the private auth atoms — the package's public
// stateful surface (external code uses hooks, never atoms directly). No UX
// side-effects in any hook (toast/navigate/open-modal stay in `app-runtime`
// handlers, L2/L8).

export const useApiKey = (): string | null => useAtomValue(apiKeyAtom)

export const useSetApiKey = () => useSetAtom(apiKeyAtom)

export const useSetSessionExpired = () => useSetAtom(sessionExpiredAtom)

export const useUsername = (): string | null => useAtomValue(usernameAtom)

export const useEcosystem = (): ChainEcosystem | null => useAtomValue(ecosystemAtom)

export const useIsAuthenticated = (): boolean => useAtomValue(isAuthenticatedAtom)

export const useClearSession = () => {
  const setApiKey = useSetAtom(apiKeyAtom)
  const setSessionExpired = useSetAtom(sessionExpiredAtom)
  return () => {
    setApiKey(null)
    setSessionExpired(false)
  }
}

// Authoritative: the server tells us via 401 (axios interceptor → bridge). No
// client-side polling — wall-clock skew can give false positives, and expiry
// detection here was redundant with the server's reply anyway.
export const useSessionExpiredWatch = (): boolean => useAtomValue(sessionExpiredAtom)
